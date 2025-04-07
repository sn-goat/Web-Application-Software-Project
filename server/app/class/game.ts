import { Fight } from '@app/class/fight';
import { Player } from '@app/class/player';
import { InternalEvents, InternalFightEvents, InternalRoomEvents, InternalTimerEvents, InternalTurnEvents } from '@app/constants/internal-events';
import {
    FIGHT_TURN_DURATION_IN_S,
    FIGHT_TURN_DURATION_NO_FLEE_IN_S,
    MOVEMENT_TIMEOUT_IN_MS,
    THREE_SECONDS_IN_MS,
    TimerType,
    TURN_DURATION_IN_S,
} from '@app/gateways/game/game.gateway.constants';
import { Board } from '@app/model/database/board';
import { GameUtils } from '@app/services/game/game-utils';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar, IGame, PathInfo } from '@common/game';
import { getLobbyLimit } from '@common/lobby-limits';
import { DEFAULT_MOVEMENT_DIRECTIONS } from '@common/player';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { log } from 'console';
import { Timer } from './timer';

export class Game implements IGame {
    internalEmitter: EventEmitter2;
    map: Cell[][];
    players: Player[];
    currentTurn: number;
    hasStarted: boolean;
    isDebugMode: boolean;
    isCTF: boolean;
    fight: Fight;
    timer: Timer;
    movementInProgress: boolean;
    pendingEndTurn: boolean;
    maxPlayers: number;

    private continueMovement: boolean;

    constructor(internalEmitter: EventEmitter2, board: Board) {
        this.internalEmitter = internalEmitter;
        this.map = board.board;
        this.players = [];
        this.currentTurn = 0;
        this.hasStarted = false;
        this.isDebugMode = false;
        this.isCTF = board.isCTF;
        this.timer = new Timer(internalEmitter);
        this.fight = new Fight(internalEmitter);
        this.movementInProgress = false;
        this.pendingEndTurn = false;
        this.maxPlayers = getLobbyLimit(board.size);

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

    addPlayer(player: Player): void {
        this.players.push(player);
    }

    closeGame(): void {
        this.internalEmitter.removeAllListeners(InternalEvents.EndTimer);
        this.internalEmitter.removeAllListeners(InternalEvents.UpdateTimer);

        if (this.fight) {
            this.fight = null;
        }

        this.players = [];
        this.hasStarted = false;
        this.movementInProgress = false;
        this.pendingEndTurn = false;
        this.maxPlayers = 0;
    }

    removePlayer(playerId: string, message: string): void {
        log(`Player ${playerId} has been removed from the game`);
        this.dropItems(playerId);
        const index = this.players.findIndex((p) => p.id === playerId);
        if (index < 0) {
            return;
        }
        this.players.splice(index, 1);
        this.internalEmitter.emit(InternalRoomEvents.PlayerRemoved, playerId, message);
    }

    getMapSize(): number {
        return this.map.length;
    }

    getTimer(): Timer {
        return this.timer;
    }

    getPlayer(playerId: string): Player {
        return this.players.find((p) => p.id === playerId);
    }

    getPlayerByAvatar(avatar: Avatar): Player {
        return this.players.find((p) => p.avatar === avatar);
    }

    isGameFull(): boolean {
        return this.players.length >= this.maxPlayers;
    }

    configureGame(): Game {
        if (this.isCTF) {
            if (this.players.length % 2 !== 0) {
                return null;
            }
            GameUtils.assignTeams(this.players);
        }
        this.hasStarted = true;
        this.players = GameUtils.sortPlayersBySpeed(this.players);
        const allSpawns = GameUtils.getAllSpawnPoints(this.map);
        const usedSpawnPoints = GameUtils.assignSpawnPoints(this.players, allSpawns, this.map);
        GameUtils.removeUnusedSpawnPoints(this.map, usedSpawnPoints);
        return this;
    }

    // TODO: Ajouter Find possible actions au turn
    configureTurn(): { player: Player; path: Record<string, PathInfo> } {
        const player = this.players[this.currentTurn];
        player.initTurn();
        const path = GameUtils.findPossiblePaths(this.map, player.position, player.movementPts);
        return { player, path: Object.fromEntries(path) };
    }

    processPath(pathInfo: PathInfo, playerId: string): void {
        const player = this.getPlayer(playerId);
        if (player && !this.pendingEndTurn) {
            this.movementInProgress = true;
            let index = 0;
            const path = pathInfo.path;
            const interval = setInterval(() => {
                if (index >= path.length) {
                    clearInterval(interval);
                    this.movementInProgress = false;
                    this.decrementMovement(player, pathInfo.cost);
                } else {
                    this.movePlayer(path[index], player);
                    if (!this.continueMovement) {
                        clearInterval(interval);
                        this.movementInProgress = false;
                        this.decrementMovement(player, index + 1);
                    } else {
                        index++;
                    }
                }
            }, MOVEMENT_TIMEOUT_IN_MS);
        }
    }

    decrementMovement(player: Player, mvtCost: number): void {
        player.movementPts -= mvtCost;
        this.checkForEndTurn(player);
    }

    decrementAction(player: Player): void {
        player.actions--;
        this.checkForEndTurn(player);
    }

    movePlayer(position: Vec2, player: Player): void {
        const previousPosition = player.position;
        this._clearCell(previousPosition);
        this._setPlayerInCell(position, player);
        this._handleItemCollection(position, player);
        this._updatePlayerPositionAndNotify(previousPosition, position, player);
    }

    movePlayerDebug(direction: Vec2, playerId: string): void {
        const player = this.getPlayer(playerId);
        this.movePlayer(direction, player);
        const path = GameUtils.findPossiblePaths(this.map, player.position, player.movementPts);
        this.internalEmitter.emit(InternalTurnEvents.Update, { player, path: Object.fromEntries(path) });
    }

    startTurn(): void {
        const turn = this.configureTurn();
        this.pendingEndTurn = false;
        this.internalEmitter.emit(InternalTurnEvents.ChangeTurn, turn);
        setTimeout(() => {
            this.timer.startTimer(TURN_DURATION_IN_S);
            this.internalEmitter.emit(InternalTurnEvents.Start, turn.player.id);
        }, THREE_SECONDS_IN_MS);
    }

    endTurn(): void {
        this.pendingEndTurn = false;
        this.currentTurn = (this.currentTurn + 1) % this.players.length;
        this.startTurn();
    }

    dropItems(playerId: string): void {
        const player = this.getPlayer(playerId);
        const items = player.inventory;
        const playerPosition = player.position;
        items.forEach((item) => {
            const directions = DEFAULT_MOVEMENT_DIRECTIONS;
            for (const direction of directions) {
                const newX = playerPosition.x + direction.x;
                const newY = playerPosition.y + direction.y;
                if (this.map[newY] && this.map[newY][newX] && this.map[newY][newX].item === Item.DEFAULT) {
                    this.map[newY][newX].item = item;
                    console.log(`Dropped item ${this.map[newY][newX].item} at position (${newX}, ${newY})`);
                    player.removeItemFromInventory(item);
                    this.internalEmitter.emit(InternalTurnEvents.DroppedItem, { player, item, position: { x: newX, y: newY } });
                    break;
                }
            }
        });
    }

    isPlayerTurn(playerId: string): boolean {
        return this.players[this.currentTurn].id === playerId;
    }

    toggleDebug(): boolean {
        this.isDebugMode = !this.isDebugMode;
        return this.isDebugMode;
    }

    changeDoorState(doorPosition: Vec2, playerId: string): { doorPosition: Vec2; newDoorState: Tile.OPENED_DOOR | Tile.CLOSED_DOOR } {
        const door = this.map[doorPosition.y][doorPosition.x];
        const player = this.getPlayer(playerId);
        door.tile = door.tile === Tile.CLOSED_DOOR ? Tile.OPENED_DOOR : Tile.CLOSED_DOOR;
        this.decrementAction(player);
        return { doorPosition, newDoorState: door.tile };
    }

    initFight(playerInitiatorId: string, playerDefenderId: string): Fight {
        const playerInitiator = this.getPlayer(playerInitiatorId);
        const playerDefender = this.getPlayer(playerDefenderId);

        playerInitiator.initFight();
        playerDefender.initFight();

        this.fight.initFight(playerInitiator, playerDefender);
        this.timer.startTimer(FIGHT_TURN_DURATION_IN_S, TimerType.Combat);
        return this.fight;
    }

    changeFighter() {
        this.fight.changeFighter();
        const fightTurnDuration = this.fight.currentPlayer.fleeAttempts === 0 ? FIGHT_TURN_DURATION_NO_FLEE_IN_S : FIGHT_TURN_DURATION_IN_S;
        this.timer.startTimer(fightTurnDuration, TimerType.Combat);
        return this.fight;
    }

    flee(): boolean {
        return this.fight.flee();
    }

    playerAttack(): void {
        log(`Player ${this.fight.currentPlayer.name} has attacked`);
        const fightResult = this.fight.playerAttack(this.isDebugMode);
        if (fightResult === null) {
            this.internalEmitter.emit(InternalFightEvents.ChangeFighter, this.changeFighter());
        } else {
            this.dropItems(fightResult.loser.id);
            this.movePlayerToSpawn(fightResult.loser);
            this.endFight();
            this.internalEmitter.emit(InternalFightEvents.End, fightResult);
        }
    }

    isPlayerInFight(playerId: string): boolean {
        return this.fight.hasFight() && this.fight.isPlayerInFight(playerId);
    }
    removePlayerOnMap(playerId: string): void {
        const player = this.getPlayer(playerId);
        this.map[player.position.y][player.position.x].player = Avatar.Default;
        this.map[player.spawnPosition.y][player.spawnPosition.x].item = Item.DEFAULT;
    }
    removePlayerFromFight(playerId: string): void {
        const fightResult = this.fight.handleFightRemoval(playerId);
        this.internalEmitter.emit(InternalFightEvents.End, fightResult);
    }

    endFight(): void {
        this.fight = new Fight(this.internalEmitter);
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
        if (cell.item !== Item.DEFAULT && cell.item !== Item.SPAWN) {
            // eslint-disable-next-line no-console
            console.log(`Joueur tente de collecter item: ${cell.item}`);
            if (player.addItemToInventory(cell.item)) {
                // eslint-disable-next-line no-console
                console.log(`Item ${cell.item} ajouté à l'inventaire du joueur ${player.name}`);
                cell.item = Item.DEFAULT;
                this.internalEmitter.emit(InternalTurnEvents.ItemCollected, {
                    player,
                    position,
                });
                this.continueMovement = false;
            } else {
                // eslint-disable-next-line no-console
                console.log(`Inventaire plein pour joueur ${player.name}`);
                this.internalEmitter.emit(InternalTurnEvents.InventoryFull, {
                    player,
                    item: cell.item,
                    position,
                });
                this.continueMovement = false;
            }
        }
    }

    private _updatePlayerPositionAndNotify(previousPosition: Vec2, newPosition: Vec2, player: Player): void {
        const fieldType = this.map[newPosition.y][newPosition.x].tile;
        player.updatePosition(newPosition, fieldType);
        this.internalEmitter.emit(InternalTurnEvents.Move, { previousPosition, player });
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
        if (this.movementInProgress) {
            this.pendingEndTurn = true;
        } else {
            this.endTurn();
        }
    }

    private checkForEndTurn(player: Player): void {
        const path = GameUtils.findPossiblePaths(this.map, player.position, player.movementPts);
        if (this.isPlayerContinueTurn(player, path.size)) {
            log(`Player ${player.name} can continue turn`);
            this.internalEmitter.emit(InternalTurnEvents.Update, { player, path: Object.fromEntries(path) });
        } else {
            this.endTurn();
        }
    }

    private isPlayerContinueTurn(player: Player, pathLength: number): boolean {
        return this.pendingEndTurn || this.isPlayerCanMove(pathLength) || this.isPlayerCanMakeAction(player);
    }

    private isPlayerCanMove(pathLength: number): boolean {
        log(`Player can move on: ${pathLength}`);
        return pathLength > 0;
    }

    private isPlayerCanMakeAction(player: Player): boolean {
        return player.actions > 0 && GameUtils.isPlayerCanMakeAction(this.map, player);
    }

    private cellHasPlayerToAttack(cell: Cell, player): boolean {
        const hasPlayer = cell.player !== undefined && cell.player !== Avatar.Default;
        if (this.isCTF) {
            const isEnemy = this.getPlayerByAvatar(cell.player).team !== player.team;
            return hasPlayer && isEnemy;
        } else {
            return hasPlayer;
        }
    }
}
