/* eslint-disable max-lines */ // TODO: fix this
import { Fight } from '@app/class/fight';
import { Player } from '@app/class/player';
import { JournalManager } from '@app/class/utils/journal-manager';
import { FightResult, FightResultType } from '@app/constants/fight-interface';
import {
    InternalEvents,
    InternalFightEvents,
    InternalGameEvents,
    InternalJournalEvents,
    InternalRoomEvents,
    InternalStatsEvents,
    InternalTimerEvents,
    InternalTurnEvents,
} from '@app/constants/internal-events';
import {
    FIGHT_TURN_DURATION_IN_S,
    FIGHT_TURN_DURATION_NO_FLEE_IN_S,
    MAX_VP_TURN_DELAY,
    MIN_VP_TURN_DELAY,
    MOVEMENT_TIMEOUT_IN_MS,
    ONE_SECOND_IN_MS,
    THREE_SECONDS_IN_MS,
    TimerType,
    TURN_DURATION_IN_S,
} from '@app/gateways/game/game.gateway.constants';
import { Board } from '@app/model/database/board';
import { GameUtils } from '@app/services/game/game-utils';
import { GameStatsUtils } from '@app/services/game/game-utils-stats';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import {
    Avatar,
    DoorState,
    GamePhase,
    GameStats,
    IGame,
    MAX_FIGHT_WINS,
    PathInfo,
    VirtualPlayerAction,
    VirtualPlayerInstructions,
} from '@common/game';
import { GameMessage } from '@common/journal';
import { getLobbyLimit } from '@common/lobby-limits';
import { IPlayer } from '@common/player';
import { Stats } from '@common/stats';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Timer } from './timer';
import { VPManager } from './utils/vp-manager';
import { VirtualPlayer } from './virtual-player';

export class Game implements IGame, GameStats {
    internalEmitter: EventEmitter2;
    map: Cell[][];
    players: Player[];
    currentTurn: number;
    isDebugMode: boolean;
    isCTF: boolean;
    fight: Fight;
    timer: Timer;
    maxPlayers: number;
    gamePhase: GamePhase;

    gameDuration: string;
    tilesVisited: Map<string, Vec2>;
    doorsHandled: Map<string, Vec2>;
    flagsCaptured: Set<string>;
    flagsCapturedCount?: number;
    disconnectedPlayers: IPlayer[];
    tilesNumber: number;
    doorsNumber: number;
    timeStartOfGame: Date;
    timeEndOfGame: Date;
    totalTurns: number;

    stats: Stats;
    inventoryFull: boolean;
    pendingEndTurn: boolean;

    movementInProgress: boolean;
    private continueMovement: boolean;
    private currentVpTurnInterval: NodeJS.Timeout | null;
    private currentVpFightTimeout: NodeJS.Timeout | null;

    constructor(internalEmitter: EventEmitter2, board: Board) {
        this.internalEmitter = internalEmitter;
        this.map = board.board;
        this.tilesNumber = board.size * board.size;
        this.doorsNumber = this.getDoorsNumber(board.board);
        this.tilesVisited = new Map<string, Vec2>();
        this.doorsHandled = new Map<string, Vec2>();
        this.flagsCaptured = new Set<string>();
        this.flagsCapturedCount = 0;
        this.disconnectedPlayers = [];
        this.timeStartOfGame = null;
        this.timeEndOfGame = null;
        this.totalTurns = 0;
        this.stats = null;
        this.players = [];
        this.currentTurn = 0;
        this.isDebugMode = false;
        this.isCTF = board.isCTF;
        this.timer = new Timer(internalEmitter);
        this.fight = new Fight(internalEmitter);
        this.movementInProgress = false;
        this.inventoryFull = false;
        this.pendingEndTurn = false;
        this.maxPlayers = getLobbyLimit(board.size);
        this.gamePhase = GamePhase.Lobby;

        this.setupTimerListeners();
    }

    addPlayer(player: Player): void {
        this.players.push(player);
    }

    closeGame(): void {
        this.clearVpInterval();
        this.clearVpFightTimeout();
        this.internalEmitter.removeAllListeners(InternalEvents.EndTimer);
        this.internalEmitter.removeAllListeners(InternalEvents.UpdateTimer);

        if (this.fight) {
            this.fight = null;
        }
        this.players = [];
        this.movementInProgress = false;
        this.inventoryFull = false;
        this.pendingEndTurn = false;
        this.maxPlayers = 0;
        this.stats = null;
        this.gamePhase = GamePhase.Lobby;
        this.endTurn();
    }

    removePlayer(playerId: string, message: string): void {
        this.dropItems(playerId);
        const index = this.players.findIndex((p) => p.id === playerId);
        if (index < 0) {
            return;
        }
        const player = this.players.splice(index, 1)[0];
        if (!(player instanceof VirtualPlayer)) {
            this.internalEmitter.emit(InternalRoomEvents.PlayerRemoved, playerId, message);
        }
        this.disconnectedPlayers.push(player);
    }

    getPlayerById(playerId: string): Player {
        return this.players.find((p) => p.id === playerId);
    }

    getPlayerByPosition(playerPosition: Vec2): Player {
        return this.players.find((p) => p.position.x === playerPosition.x && p.position.y === playerPosition.y);
    }

    isGameFull(): boolean {
        return this.players.length >= this.maxPlayers;
    }

    canGameContinue(): boolean {
        const hasDifferentTeams = this.isCTF ? this.hasDifferentTeams() : true;
        return this.players.length > 1 && this.hasPhysicalPlayers() && hasDifferentTeams;
    }

    configureGame(): Game {
        if (this.isCTF) {
            if (this.players.length % 2 !== 0) {
                return null;
            }
            GameUtils.assignTeams(this.players);
        }
        this.gamePhase = GamePhase.InGame;
        GameUtils.normalizeChestItems(this.map);
        this.players = GameUtils.sortPlayersBySpeed(this.players);
        const allSpawns = GameUtils.getAllSpawnPoints(this.map);
        const usedSpawnPoints = GameUtils.assignSpawnPoints(this.players, allSpawns, this.map);
        GameUtils.removeUnusedSpawnPoints(this.map, usedSpawnPoints);
        this.startGameTimer();
        return this;
    }

    processPath(pathInfo: PathInfo, playerId: string): void {
        const player = this.getPlayerById(playerId);
        if (player && !this.pendingEndTurn) {
            this.movementInProgress = true;
            let index = 0;
            const path = pathInfo.path;
            let effectiveCost = 0;
            const interval = setInterval(() => {
                if (index >= path.length) {
                    clearInterval(interval);
                    this.movementInProgress = false;
                    this.decrementMovement(player, effectiveCost);
                } else {
                    const nextPos = path[index];
                    const currentCell = this.map[player.position.y][player.position.x];
                    const stepCost = currentCell.cost;
                    effectiveCost += stepCost;
                    this.movePlayer(nextPos, player);
                    if (!this.continueMovement) {
                        clearInterval(interval);
                        this.movementInProgress = false;
                        this.decrementMovement(player, effectiveCost);
                    } else {
                        index++;
                    }
                }
            }, MOVEMENT_TIMEOUT_IN_MS);
        }
    }

    decrementMovement(player: Player, mvtCost: number): void {
        player.movementPts = Math.max(0, player.movementPts - mvtCost);
        if (!(player instanceof VirtualPlayer)) {
            this.checkForEndTurn(player);
        }
    }

    decrementAction(player: Player): void {
        player.actions--;
        if (!(player instanceof VirtualPlayer)) {
            this.checkForEndTurn(player);
        }
    }

    movePlayer(position: Vec2, player: Player): void {
        const previousPosition = player.position;
        this._clearCell(previousPosition);
        this._setPlayerInCell(position, player);
        this._handleItemCollection(position, player);
        this._updatePlayerPositionAndNotify(previousPosition, position, player);
        this.manageEndGame(player);
    }

    movePlayerDebug(direction: Vec2, playerId: string): void {
        const player = this.getPlayerById(playerId);
        this.movePlayer(direction, player);
        if (player.isCtfWinner()) {
            this.internalEmitter.emit(InternalGameEvents.Winner, player);
            return;
        }
        const path = GameUtils.findPossiblePaths(this.map, player.position, player.movementPts);
        this.internalEmitter.emit(InternalTurnEvents.Update, { player, path: Object.fromEntries(path) });
    }

    startTurn(): void {
        const player = this.players[this.currentTurn];
        player.initTurn();
        this.totalTurns++;
        let turn: { player: Player; path: Record<string, PathInfo> };
        if (player instanceof VirtualPlayer) {
            turn = {
                player,
                path: Object.fromEntries(new Map<string, PathInfo>()),
            };
            this.pendingEndTurn = false;
        } else {
            const path = GameUtils.findPossiblePaths(this.map, player.position, player.movementPts);
            turn = {
                player,
                path: Object.fromEntries(path),
            };
        }
        this.internalEmitter.emit(InternalTurnEvents.ChangeTurn, turn);
        this.dispatchJournalEntry(GameMessage.StartTurn, [turn.player]);
        setTimeout(() => {
            this.timer.startTimer(TURN_DURATION_IN_S);
            if (player instanceof VirtualPlayer) {
                this.computeVirtualPlayerTurn(player);
            } else {
                this.internalEmitter.emit(InternalTurnEvents.Start, player.id);
            }
        }, THREE_SECONDS_IN_MS);
    }

    endTurn(): void {
        this.pendingEndTurn = false;
        this.timer.stopTimer();
        if (this.gamePhase === GamePhase.InGame) {
            this.currentTurn = (this.currentTurn + 1) % this.players.length;
            this.startTurn();
        }
    }

    dropItems(playerId: string): void {
        const player = this.getPlayerById(playerId);
        if (!player || !player.inventory.length) return;
        const playerPos = player.position;
        const droppedItems = [];
        for (const item of [...player.inventory]) {
            const dropPos = GameUtils.findValidDropCell(this.map, playerPos, droppedItems, this.players);
            if (dropPos) {
                this.map[dropPos.y][dropPos.x].item = item;
                player.removeItemFromInventory(item);
                droppedItems.push({ item, position: dropPos });
            } else {
                const fallback = player.spawnPosition || playerPos;
                this.map[fallback.y][fallback.x].item = item;
                player.removeItemFromInventory(item);
                droppedItems.push({ item, position: { ...fallback } });
            }
        }
        if (droppedItems.length > 0) {
            this.internalEmitter.emit(InternalTurnEvents.DroppedItem, {
                player,
                droppedItems,
            });
        }
    }

    isPlayerTurn(playerId: string): boolean {
        if (this.players[this.currentTurn].id) {
            return this.players[this.currentTurn].id === playerId;
        } else {
            return true;
        }
    }

    toggleDebug(adminId: string): boolean {
        this.isDebugMode = !this.isDebugMode;
        if (this.isDebugMode) {
            this.dispatchJournalEntry(GameMessage.ActivateDebugMode, [this.getPlayerById(adminId)]);
        } else {
            this.dispatchJournalEntry(GameMessage.DeactivateDebugMode, [this.getPlayerById(adminId)]);
        }
        return this.isDebugMode;
    }

    changeDoorState(doorPosition: Vec2, playerId: string): void {
        const door = this.map[doorPosition.y][doorPosition.x];
        const player = this.getPlayerById(playerId);
        door.tile = door.tile === Tile.ClosedDoor ? Tile.OpenedDoor : Tile.ClosedDoor;
        const doorState: DoorState = { position: doorPosition, state: door.tile };
        this.doorsHandled.set(`${doorPosition.x},${doorPosition.y}`, doorPosition);
        if (door.tile === Tile.OpenedDoor) {
            this.dispatchJournalEntry(GameMessage.OpenDoor, [player]);
        } else if (door.tile === Tile.ClosedDoor) {
            this.dispatchJournalEntry(GameMessage.CloseDoor, [player]);
        }
        this.decrementAction(player);
        this.internalEmitter.emit(InternalTurnEvents.DoorStateChanged, doorState);
    }

    initFight(playerInitiatorId: string, playerDefenderId: string): void {
        const playerInitiator = this.getPlayerById(playerInitiatorId);
        const playerDefender = this.getPlayerById(playerDefenderId);
        playerInitiator.initFight();
        playerDefender.initFight();

        this.fight.initFight(playerInitiator, playerDefender);
        this.timer.startTimer(FIGHT_TURN_DURATION_IN_S, TimerType.Combat);
        if (this.fight.currentPlayer instanceof VirtualPlayer) {
            this.computeVirtualPlayerFight(this.fight.currentPlayer);
        }
        this.dispatchJournalEntry(GameMessage.StartFight, [playerInitiator, playerDefender]);
    }

    changeFighter() {
        this.fight.changeFighter();
        const fightTurnDuration = this.fight.currentPlayer.fleeAttempts === 0 ? FIGHT_TURN_DURATION_NO_FLEE_IN_S : FIGHT_TURN_DURATION_IN_S;
        this.timer.startTimer(fightTurnDuration, TimerType.Combat);
        if (this.fight.currentPlayer instanceof VirtualPlayer) {
            this.computeVirtualPlayerFight(this.fight.currentPlayer);
        }
    }

    flee(): void {
        if (this.fight.flee()) {
            const opponent = this.fight.getOpponent(this.fight.currentPlayer.id);
            this.dispatchJournalEntry(GameMessage.FleeSuccess, [this.fight.currentPlayer]);
            opponent.totalFights += 1;
            this.endFight();
            const fightResult: FightResult = { type: FightResultType.Tie };
            this.internalEmitter.emit(InternalFightEvents.End, fightResult);
        } else {
            this.dispatchJournalEntry(GameMessage.FleeFailure, [this.fight.currentPlayer, this.fight.getOpponent(this.fight.currentPlayer.id)]);
            this.changeFighter();
        }
    }

    playerAttack(): void {
        if (!this.fight) return;
        const fightResult = this.fight.playerAttack(this.isDebugMode);
        if (fightResult === null) {
            this.changeFighter();
        } else {
            this.dropItems(fightResult.loser.id);
            this.movePlayerToSpawn(fightResult.loser);
            this.dispatchJournalEntry(GameMessage.EndFight, [fightResult.winner, fightResult.loser]);
            this.dispatchJournalEntry(GameMessage.WinnerFight, [fightResult.winner]);
            this.dispatchJournalEntry(GameMessage.LoserFight, [fightResult.loser]);
            this.endFight(fightResult.loser);
            this.internalEmitter.emit(InternalFightEvents.End, fightResult);
            this.manageEndGame(fightResult.winner);
        }
    }

    removePlayerOnMap(playerId: string): void {
        const player = this.getPlayerById(playerId);
        this.map[player.position.y][player.position.x].player = Avatar.Default;
        this.map[player.spawnPosition.y][player.spawnPosition.x].item = Item.Default;
        this.internalEmitter.emit(InternalGameEvents.MapUpdated, this.map);
        this.dispatchJournalEntry(GameMessage.Quit, [player]);
    }

    computeVirtualPlayerTurn(player: VirtualPlayer): void {
        this.clearVpInterval();
        let timeBeforeTurn = Math.max(MIN_VP_TURN_DELAY, Math.floor(Math.random() * MAX_VP_TURN_DELAY));
        this.currentVpTurnInterval = setInterval(() => {
            if (!this.isPlayerTurn(player.id)) {
                this.clearVpInterval();
                return;
            }

            const instruction: VirtualPlayerInstructions = VPManager.getInstruction(player, this.isCTF, this.players, this.map);

            if (instruction.action === VirtualPlayerAction.EndTurn) {
                this.clearVpInterval();
                this.endTurn();
            } else {
                timeBeforeTurn = Math.max(MIN_VP_TURN_DELAY, Math.floor(Math.random() * MAX_VP_TURN_DELAY));
                this.processVirtualPlayerInstructions(player, instruction);
                if (instruction.action === VirtualPlayerAction.InitFight) {
                    this.clearVpInterval();
                }
            }
        }, timeBeforeTurn);
    }

    endFight(loser?: Player): void {
        this.fight = new Fight(this.internalEmitter);
        if (loser && this.isPlayerTurn(loser.id)) {
            this.endTurn();
            return;
        }
        this.timer.resumeTimer();
        const playingPlayer = this.players[this.currentTurn];
        this.decrementAction(playingPlayer);
        if (playingPlayer instanceof VirtualPlayer) {
            this.computeVirtualPlayerTurn(playingPlayer);
        }
    }

    hasPhysicalPlayers(): boolean {
        return this.getPhysicalPlayers().length > 0;
    }

    getPhysicalPlayers(): Player[] {
        return this.players.filter((player) => !(player instanceof VirtualPlayer));
    }

    private hasDifferentTeams(): boolean {
        return this.players.some((player) => player.team !== this.players[0].team);
    }

    private _clearCell(position: Vec2): void {
        this.map[position.y][position.x].player = Avatar.Default;
    }

    private _setPlayerInCell(position: Vec2, player: Player): void {
        this.map[position.y][position.x].player = player.avatar as Avatar;
    }

    private _handleItemCollection(position: Vec2, player: Player): void {
        const cell = this.map[position.y][position.x];
        this.continueMovement = true;
        if (cell.item !== Item.Default && cell.item !== Item.Spawn) {
            if (player.addItemToInventory(cell.item)) {
                this.dispatchJournalEntry(GameMessage.PickItem, [player], cell.item);
                cell.item = Item.Default;
                this.internalEmitter.emit(InternalTurnEvents.ItemCollected, {
                    player,
                    position,
                });
            } else {
                if (!(player instanceof VirtualPlayer)) {
                    this.inventoryFull = true;
                    this.internalEmitter.emit(InternalTurnEvents.InventoryFull, {
                        player,
                        item: cell.item,
                        position,
                    });
                }
            }
            this.continueMovement = false;
        }
    }

    private _updatePlayerPositionAndNotify(previousPosition: Vec2, newPosition: Vec2, player: Player): void {
        const fieldType = this.map[newPosition.y][newPosition.x].tile;
        player.updatePosition(newPosition, fieldType);
        this.internalEmitter.emit(InternalTurnEvents.Move, { previousPosition, player });
    }

    private clearVpInterval(): void {
        if (this.currentVpTurnInterval) {
            clearInterval(this.currentVpTurnInterval);
            this.currentVpTurnInterval = null;
        }
    }

    private clearVpFightTimeout(): void {
        if (this.currentVpFightTimeout) {
            clearTimeout(this.currentVpFightTimeout);
            this.currentVpFightTimeout = null;
        }
    }

    private startGameTimer(): void {
        this.timeStartOfGame = new Date();
    }

    private endGameTimer(): void {
        this.timeEndOfGame = new Date();
    }

    private getDoorsNumber(map: Cell[][]): number {
        return map.reduce((count, row) => {
            return count + row.filter((cell) => cell.tile === Tile.ClosedDoor || cell.tile === Tile.OpenedDoor).length;
        }, 0);
    }

    private movePlayerToSpawn(player: Player): void {
        let positionToSpawn: Vec2 = player.spawnPosition;
        const playerOnSpawn = this.map[player.spawnPosition.y][player.spawnPosition.x].player;
        if (playerOnSpawn !== Avatar.Default && playerOnSpawn !== player.avatar) {
            positionToSpawn = GameUtils.findValidSpawn(this.map, player.spawnPosition);
        }
        this.movePlayer(positionToSpawn, player);
    }

    private endTurnRequested(): void {
        if (this.movementInProgress || this.inventoryFull) {
            this.pendingEndTurn = true;
        } else {
            this.endTurn();
        }
    }

    private checkForEndTurn(player: Player): void {
        const path = GameUtils.findPossiblePaths(this.map, player.position, player.movementPts);
        if (this.isPlayerContinueTurn(player, path.size)) {
            this.internalEmitter.emit(InternalTurnEvents.Update, { player, path: Object.fromEntries(path) });
        } else {
            this.endTurn();
        }
    }

    private isPlayerContinueTurn(player: Player, pathLength: number): boolean {
        return !this.pendingEndTurn && (pathLength > 0 || GameUtils.isPlayerCanMakeAction(this.map, player));
    }

    private processVirtualPlayerInstructions(vPlayer: VirtualPlayer, instruction: VirtualPlayerInstructions): void {
        switch (instruction.action) {
            case VirtualPlayerAction.Move:
                this.processPath(instruction.pathInfo, vPlayer.id);
                break;
            case VirtualPlayerAction.InitFight:
                this.initFight(vPlayer.id, this.getPlayerByPosition(instruction.target).id);
                break;
            case VirtualPlayerAction.OpenDoor:
                this.changeDoorState(instruction.target, vPlayer.id);
                break;
            default:
                break;
        }
    }

    private computeVirtualPlayerFight(vPlayer: VirtualPlayer): void {
        this.clearVpFightTimeout();
        this.currentVpFightTimeout = setTimeout(() => {
            this.currentVpFightTimeout = null;
            if (!this.fight) return;
            const fightAction = VPManager.processFightAction(vPlayer);
            if (fightAction === VirtualPlayerAction.Flee) {
                this.flee();
            } else {
                this.playerAttack();
            }
        }, ONE_SECOND_IN_MS);
    }

    private dispatchJournalEntry(messageType: GameMessage, playersInvolved: Player[], item?: Item): void {
        const message = JournalManager.processEntry(messageType, playersInvolved, item);
        if (message) {
            this.internalEmitter.emit(InternalJournalEvents.Add, message);
        }
    }

    private dispatchGameStats(): void {
        this.endGameTimer();
        this.stats = GameStatsUtils.calculateStats(this.players, this);
        this.internalEmitter.emit(InternalStatsEvents.DispatchStats, this.stats);
    }

    private manageEndGame(player: Player): void {
        const isPlayerWinner = this.isCTF ? player.isCtfWinner() : player.wins >= MAX_FIGHT_WINS;
        if (isPlayerWinner) {
            this.gamePhase = GamePhase.AfterGame;
            this.endTurn();
            this.internalEmitter.emit(InternalGameEvents.Winner, player);
            const playerWithoutWinner = this.players.filter((p) => p.id !== player.id);
            this.dispatchJournalEntry(GameMessage.EndGame, [player, ...playerWithoutWinner]);
            this.dispatchGameStats();
        }
    }

    private setupTimerListeners() {
        this.internalEmitter.on(InternalEvents.EndTimer, () => {
            if (this.fight.hasFight()) {
                this.playerAttack();
            } else {
                this.endTurnRequested();
            }
        });

        this.internalEmitter.on(InternalEvents.UpdateTimer, (remainingTime) => {
            if (this.fight.hasFight()) {
                this.internalEmitter.emit(InternalTimerEvents.FightUpdate, remainingTime);
            } else {
                this.internalEmitter.emit(InternalTimerEvents.TurnUpdate, remainingTime);
            }
        });
    }
}
