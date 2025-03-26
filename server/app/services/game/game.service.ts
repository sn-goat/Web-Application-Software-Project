import { MOVEMENT_TIMEOUT_IN_MS, TURN_DURATION_IN_S } from '@app/gateways/game/game.gateway.constants';
import { InternalEvents, InternalTurnEvents } from '@app/constants/internal-events';
import { BoardService } from '@app/services/board/board.service';
import { FightService } from '@app/services/fight/fight.service';
import { GameUtils } from '@app/services/game/game-utils';
import { TimerService } from '@app/services/timer/timer.service';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar, IFight, IGame, PathInfo } from '@common/game';
import { TurnEvents } from '@common/game.gateway.events';
import { ATTACK_ICE_DECREMENT, DEFAULT_ATTACK_VALUE, DEFAULT_DEFENSE_VALUE, DEFENSE_ICE_DECREMENT, PlayerStats } from '@common/player';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class GameService {
    private currentGames: Map<string, IGame>;
    private logger: Logger = new Logger(GameService.name);
    private activeFights: Map<string, IFight> = new Map();
    private movementInProgress: Map<string, boolean> = new Map();
    private pendingEndTurn: Map<string, boolean> = new Map();

    constructor(
        private boardService: BoardService,
        private timerService: TimerService,
        private fightService: FightService,
        private eventEmitter: EventEmitter2,
    ) {
        this.currentGames = new Map();
    }

    toggleDebugState(accessCode: string) {
        this.currentGames.get(accessCode).isDebugMode = !this.currentGames.get(accessCode).isDebugMode;
    }

    endDebugMode(accessCode: string) {
        this.currentGames.get(accessCode).isDebugMode = false;
    }

    isGameDebugMode(accessCode: string): boolean {
        return this.currentGames.get(accessCode).isDebugMode;
    }

    hasActiveFight(accessCode: string): boolean {
        return this.activeFights.has(accessCode);
    }

    changeDoorState(accessCode: string, position: Vec2, player: PlayerStats) {
        const activePlayer = this.getPlayer(accessCode, player.id);
        const cell: Cell = this.getMap(accessCode)[position.y][position.x];
        cell.tile = cell.tile === Tile.CLOSED_DOOR ? Tile.OPENED_DOOR : Tile.CLOSED_DOOR;
        this.eventEmitter.emit(InternalTurnEvents.BroadcastDoor, { accessCode, position, newState: cell.tile });
        this.decrementAction(accessCode, activePlayer);
    }

    decrementAction(accessCode: string, player: PlayerStats) {
        const activePlayer = this.getPlayer(accessCode, player.id);
        activePlayer.actions--;
        if (this.isPlayerTurnEnded(accessCode, activePlayer) || this.updatePlayerPathTurn(accessCode, player).size === 0) {
            this.eventEmitter.emit(InternalTurnEvents.End, accessCode);
        }
    }

    decrementMovement(accessCode: string, player: PlayerStats, cost: number) {
        const activePlayer = this.getPlayer(accessCode, player.id);
        activePlayer.movementPts -= cost;
        if (
            this.pendingEndTurn.get(accessCode) ||
            this.isPlayerTurnEnded(accessCode, activePlayer) ||
            this.updatePlayerPathTurn(accessCode, player).size === 0
        ) {
            this.eventEmitter.emit(InternalTurnEvents.End, accessCode);
            this.pendingEndTurn.set(accessCode, false);
        }
    }

    configureGame(accessCode: string, players: PlayerStats[]) {
        const game: Game = this.currentGames.get(accessCode);
        if (game) {
            game.players = GameUtils.sortPlayersBySpeed(players);
            const usedSpawnPoints = GameUtils.assignSpawnPoints(game.players, GameUtils.getAllSpawnPoints(game.map), game.map);
            GameUtils.removeUnusedSpawnPoints(game.map, usedSpawnPoints);
            return game;
        }
        return null;
    }

    configureTurn(accessCode: string): { player: PlayerStats; path: Record<string, PathInfo> } {
        this.logger.log(`Configuring turn for game ${accessCode}`);
        const playerTurn = this.getPlayerTurn(accessCode);
        this.logger.log(`Configuring turn for game ${playerTurn.id}`);

        playerTurn.movementPts = playerTurn.speed;
        playerTurn.actions = 1;
        const path = GameUtils.findPossiblePaths(this.currentGames.get(accessCode).map, playerTurn.position, playerTurn.movementPts);
        return {
            player: playerTurn,
            path: Object.fromEntries(path),
        };
    }

    updatePlayerPathTurn(accessCode: string, playerToUpdate: PlayerStats): Map<string, PathInfo> {
        const player = this.getPlayer(accessCode, playerToUpdate.id);
        const map = this.getMap(accessCode);
        const updatedPath = GameUtils.findPossiblePaths(map, player.position, player.movementPts);
        this.eventEmitter.emit(TurnEvents.UpdateTurn, { player, path: Object.fromEntries(updatedPath) });
        return updatedPath;
    }

    async createGame(accessCode: string, organizerId: string, map: string) {
        const board = await this.boardService.getBoard(map);
        if (!board) {
            this.logger.error('Board not found');
            throw new Error('Board not found');
        } else {
            this.logger.log(`New game created, accessCode: ${accessCode} - organizerId: ${organizerId}`);
            this.currentGames.set(accessCode, {
                organizerId,
                players: [],
                map: board.board,
                currentTurn: 0,
                isDebugMode: false,
                accessCode,
            });
        }
    }

    removePlayer(accessCode: string, playerId: string) {
        this.logger.log(`Removing player ${playerId} from game ${accessCode}`);
        const game = this.currentGames.get(accessCode);
        if (this.fightService.getFight(accessCode) ?? false) {
            const loser = this.fightService.getFighter(accessCode, playerId);
            const winner = this.fightService.getOpponent(accessCode, playerId);
            this.fightService.endFight(accessCode, winner, loser);
        }
        const player = this.getPlayer(accessCode, playerId);
        game.map[player.position.y][player.position.x].player = Avatar.Default;
        game.map[player.spawnPosition.y][player.spawnPosition.x].item = Item.DEFAULT;
        game.players = game.players.filter((p) => p.id !== playerId);
        this.eventEmitter.emit(InternalEvents.PlayerRemoved, { accessCode, game });
    }

    deleteGame(accessCode: string) {
        this.timerService.stopTimer(accessCode);
        this.currentGames.delete(accessCode);
        this.logger.log(`Game ${accessCode} deleted`);
    }

    processPath(accessCode: string, pathInfo: PathInfo, player: PlayerStats) {
        const activePlayer = this.getPlayer(accessCode, player.id);
        if (activePlayer) {
            this.movementInProgress.set(accessCode, true);

            if (!this.pendingEndTurn.has(accessCode)) {
                this.pendingEndTurn.set(accessCode, false);
            }

            let index = 0;
            const path = pathInfo.path;
            const interval = setInterval(() => {
                if (index < path.length) {
                    this.movePlayer(accessCode, path[index], activePlayer);
                    activePlayer.position = path[index];
                    index++;
                } else {
                    clearInterval(interval);
                    this.movementInProgress.set(accessCode, false);
                    this.decrementMovement(accessCode, activePlayer, pathInfo.cost);
                }
            }, MOVEMENT_TIMEOUT_IN_MS);
        }
    }

    movePlayerToSpawn(accessCode: string, player: PlayerStats): void {
        const map = this.getMap(accessCode);
        if (
            map[player.spawnPosition.y][player.spawnPosition.x].player !== Avatar.Default &&
            map[player.spawnPosition.y][player.spawnPosition.x].player !== player.avatar
        ) {
            const alternateSpawn = GameUtils.findValidSpawn(map, player.spawnPosition);
            if (alternateSpawn) this.movePlayer(accessCode, alternateSpawn, player);
            return;
        }

        this.movePlayer(accessCode, player.spawnPosition, player);
    }

    movePlayer(accessCode: string, direction: Vec2, player: PlayerStats): void {
        const movingPlayer = this.getPlayer(accessCode, player.id);
        const map = this.getMap(accessCode);
        const previousPosition = movingPlayer.position;
        map[previousPosition.y][previousPosition.x].player = Avatar.Default;
        map[direction.y][direction.x].player = movingPlayer.avatar as Avatar;
        movingPlayer.position = direction;
        if (map[direction.y][direction.x].tile === Tile.ICE) {
            movingPlayer.attack = DEFAULT_ATTACK_VALUE - ATTACK_ICE_DECREMENT;
            movingPlayer.defense = DEFAULT_DEFENSE_VALUE - DEFENSE_ICE_DECREMENT;
        } else {
            movingPlayer.attack = DEFAULT_ATTACK_VALUE;
            movingPlayer.defense = DEFAULT_DEFENSE_VALUE;
        }
        this.eventEmitter.emit(InternalTurnEvents.Move, { accessCode, previousPosition, player: movingPlayer });
    }

    getPlayer(accessCode: string, playerId: string): PlayerStats {
        return this.currentGames.get(accessCode).players.find((player) => player.id === playerId);
    }

    startTimer(accessCode: string) {
        this.timerService.startTimer(accessCode, TURN_DURATION_IN_S, 'movement');
    }

    isActivePlayerReady(accessCode: string, playerId: string) {
        return this.getPlayerTurn(accessCode).id === playerId;
    }

    getPlayerTurn(accessCode: string): PlayerStats {
        const game = this.currentGames.get(accessCode);
        return game ? game.players[game.currentTurn] : undefined;
    }

    getMap(accessCode: string): Cell[][] {
        return this.currentGames.get(accessCode).map;
    }

    switchTurn(accessCode: string) {
        const game = this.currentGames.get(accessCode);
        if (game) {
            game.currentTurn = (game.currentTurn + 1) % game.players.length;
            this.logger.log(`Player's turn: ${this.getPlayerTurn(accessCode).name} `);
        }
    }

    endTurnRequested(accessCode: string) {
        if (this.movementInProgress.get(accessCode)) {
            this.pendingEndTurn.set(accessCode, true);
        } else {
            this.eventEmitter.emit(InternalTurnEvents.End, accessCode);
        }
    }

    incrementWins(accessCode: string, playerId: string) {
        const player = this.getPlayer(accessCode, playerId);
        if (player) {
            player.wins++;
        }
    }

    private isPlayerTurnEnded(accessCode: string, player: PlayerStats) {
        const map = this.getMap(accessCode);
        if (map) {
            if (player.movementPts > 0 || (player.actions > 0 && GameUtils.isPlayerCanMakeAction(map, player.position))) {
                return false;
            }
            return true;
        }
    }
}
