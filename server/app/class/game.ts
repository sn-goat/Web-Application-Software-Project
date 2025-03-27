import { Cell, Vec2 } from '@common/board';
import { Player } from '@app/class/player';
import { getLobbyLimit } from '@common/lobby-limits';
import { Fight } from '@app/class/fight';
import { Avatar, IGame, PathInfo } from '@common/game';
import { GameUtils } from '@app/services/game/game-utils';
import { Timer } from './timer';
import { InternalEvents, InternalFightEvents, InternalRoomEvents, InternalTimerEvents, InternalTurnEvents } from '@app/constants/internal-events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
    FIGHT_TURN_DURATION_IN_S,
    FIGHT_TURN_DURATION_NO_FLEE_IN_S,
    MOVEMENT_TIMEOUT_IN_MS,
    THREE_SECONDS_IN_MS,
    TimerType,
    TURN_DURATION_IN_S,
} from '@app/gateways/game/game.gateway.constants';
import { Item, Tile } from '@common/enums';

export class Game implements IGame {
    internalEmitter: EventEmitter2;
    map: Cell[][];
    players: Player[];
    currentTurn: number;
    hasStarted: boolean;
    isDebugMode: boolean;
    fight: Fight;
    timer: Timer;
    movementInProgress: boolean;
    pendingEndTurn: boolean;

    constructor(internalEmitter: EventEmitter2, map: Cell[][]) {
        this.internalEmitter = internalEmitter;
        this.map = map;
        this.players = [];
        this.currentTurn = 0;
        this.hasStarted = false;
        this.isDebugMode = false;
        this.timer = new Timer(internalEmitter);
        this.fight = new Fight(internalEmitter);
        this.movementInProgress = false;
        this.pendingEndTurn = false;

        this.internalEmitter.on(InternalTimerEvents.End, () => {
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

    removePlayer(playerId: string, message: string): void {
        const index = this.players.findIndex((p) => p.id === playerId);
        if (index < 0) {
            return;
        }
        this.players.splice(index, 1);
        this.internalEmitter.emit(InternalRoomEvents.PlayerRemoved, { playerId, message });
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

    isGameFull(): boolean {
        return this.players.length >= getLobbyLimit(this.getMapSize());
    }

    configureGame(): Game {
        this.players = GameUtils.sortPlayersBySpeed(this.players);
        const allSpawns = GameUtils.getAllSpawnPoints(this.map);
        const usedSpawnPoints = GameUtils.assignSpawnPoints(this.players, allSpawns, this.map);
        GameUtils.removeUnusedSpawnPoints(this.map, usedSpawnPoints);
        return this;
    }

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
                    index++;
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
        this.map[previousPosition.y][previousPosition.x].player = Avatar.Default;
        this.map[position.y][position.x].player = player.avatar as Avatar;
        const fieldType = this.map[position.y][position.x].tile;
        player.updatePosition(position, fieldType);
        this.internalEmitter.emit(InternalTurnEvents.Move, { previousPosition, player });
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
        this.players[this.currentTurn].actions = 0;
        this.currentTurn = (this.currentTurn + 1) % this.players.length;
        this.startTurn();
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
        this.fight.initFight(this.getPlayer(playerInitiatorId), this.getPlayer(playerDefenderId));
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
        const fightResult = this.fight.playerAttack(this.isDebugMode);
        if (fightResult === null) {
            this.internalEmitter.emit(InternalFightEvents.ChangeFighter, this.changeFighter());
        } else {
            this.movePlayerToSpawn(fightResult.loser);
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
        if (this.isPlayerContinueTurn(player, Object.keys(path))) {
            this.internalEmitter.emit(InternalTurnEvents.Update, { player, path: Object.fromEntries(path) });
        } else {
            this.endTurn();
        }
    }

    private isPlayerContinueTurn(player: Player, path: string[]): boolean {
        return this.pendingEndTurn || this.isPlayerCanMove(Object.keys(path)) || this.isPlayerCanMakeAction(player);
    }

    private isPlayerCanMove(path: string[]): boolean {
        return path.length > 0;
    }

    private isPlayerCanMakeAction(player: Player): boolean {
        return player.actions > 0 && GameUtils.isPlayerCanMakeAction(this.map, player.position);
    }
}
