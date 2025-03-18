/* eslint-disable max-lines */
import { MOVEMENT_TIMEOUT_IN_MS, RANDOM_SORT_OFFSET, TURN_DURATION_IN_S } from '@app/gateways/game/game.gateway.constants';
import { Cell, TILE_COST, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar, Fight, Game, PathInfo } from '@common/game';
import { GameEvents, TurnEvents } from '@common/game.gateway.events';
import {
    ATTACK_ICE_DECREMENT,
    DEFAULT_ATTACK_VALUE,
    DEFAULT_DEFENSE_VALUE,
    DEFAULT_MOVEMENT_DIRECTIONS,
    DEFENSE_ICE_DECREMENT,
    PlayerStats,
} from '@common/player';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BoardService } from '@app/services/board/board.service';
import { TimerService } from '@app/services/timer/timer.service';

@Injectable()
export class GameService {
    private currentGames: Map<string, Game>;
    private logger: Logger = new Logger(GameService.name);
    private activeFights: Map<string, Fight> = new Map();
    private movementInProgress: Map<string, boolean> = new Map();
    private pendingEndTurn: Map<string, boolean> = new Map();

    constructor(
        private boardService: BoardService,
        private timerService: TimerService,
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
        this.eventEmitter.emit(TurnEvents.BroadcastDoor, { accessCode, position, newState: cell.tile });
        this.decrementAction(accessCode, activePlayer);
    }

    decrementAction(accessCode: string, player: PlayerStats) {
        const activePlayer = this.getPlayer(accessCode, player.id);
        activePlayer.actions--;
        if (this.isPlayerTurnEnded(accessCode, activePlayer)) {
            this.eventEmitter.emit(TurnEvents.End, accessCode);
        }
    }

    decrementMovement(accessCode: string, player: PlayerStats, cost: number) {
        const activePlayer = this.getPlayer(accessCode, player.id);
        activePlayer.movementPts -= cost;
        if (this.pendingEndTurn.get(accessCode) || this.isPlayerTurnEnded(accessCode, activePlayer)) {
            this.eventEmitter.emit(TurnEvents.End, accessCode);
            this.pendingEndTurn.set(accessCode, false);
        }
    }

    configureGame(accessCode: string, players: PlayerStats[]) {
        const game: Game = this.currentGames.get(accessCode);
        if (game) {
            game.players = this.sortPlayersBySpeed(players);
            const usedSpawnPoints = this.assignSpawnPoints(game.players, this.getAllSpawnPoints(game.map), game.map);
            this.removeUnusedSpawnPoints(game.map, usedSpawnPoints);
            return game;
        }
        return null;
    }

    configureTurn(accessCode: string): { player: PlayerStats; path: Record<string, PathInfo> } {
        this.logger.log(`Configuring turn for game ${accessCode}`);
        const playerTurn = this.getPlayerTurn(accessCode);
        this.logger.log(`Configuring turn for game ${playerTurn.id}`);

        if (!playerTurn) {
            this.logger.log('No player turn found');
        }
        playerTurn.movementPts = playerTurn.speed;
        playerTurn.actions = 1;
        const path = this.findPossiblePaths(this.currentGames.get(accessCode).map, playerTurn.position, playerTurn.movementPts);
        return {
            player: playerTurn,
            path: Object.fromEntries(path),
        };
    }

    updatePlayerPathTurn(accessCode: string, playerToUpdate: PlayerStats) {
        const player = this.getPlayer(accessCode, playerToUpdate.id);
        const map = this.getMap(accessCode);
        const updatedPath = this.findPossiblePaths(map, player.position, player.movementPts);
        this.eventEmitter.emit(TurnEvents.UpdateTurn, { player, path: Object.fromEntries(updatedPath) });
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

    async quitGame(accessCode: string, playerId: string) {
        const game = this.currentGames.get(accessCode);
        let lastPlayer: PlayerStats;
        if (game) {
            const index = game.players.findIndex((playerFound: PlayerStats) => playerFound.id === playerId);
            if (index >= 0) {
                const player = game.players[index];
                game.isDebugMode = false;

                if (game.players.length === 2) {
                    lastPlayer = game.players.find((playerFound: PlayerStats) => playerFound.id !== playerId);
                    for (let i = game.players.length - 1; i >= 0; i--) {
                        game.map[player.position.y][player.position.x].player = Avatar.Default;
                        game.map[player.spawnPosition.y][player.spawnPosition.x].item = Item.DEFAULT;
                        game.players.splice(i, 1);
                        this.logger.log(`Player ${playerId} quit the game`);
                    }
                    this.timerService.stopTimer(accessCode);
                    this.currentGames.delete(accessCode);
                    this.logger.log(`Game ${accessCode} deleted`);
                } else {
                    game.map[player.position.y][player.position.x].player = Avatar.Default;
                    game.map[player.spawnPosition.y][player.spawnPosition.x].item = Item.DEFAULT;
                    game.players.splice(index, 1);
                    this.logger.log(`Player ${playerId} quit the game`);
                }
            }
            return { game, lastPlayer };
        }
        return null;
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
        this.eventEmitter.emit(TurnEvents.Move, { accessCode, previousPosition, player: movingPlayer });
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
        // If movement is in progress, flag that we should end the turn when movement finishes.
        if (this.movementInProgress.get(accessCode)) {
            this.pendingEndTurn.set(accessCode, true);
        } else {
            // Otherwise, end turn immediately.
            this.eventEmitter.emit(TurnEvents.End, accessCode);
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
            if (player.movementPts > 0 || (player.actions > 0 && this.isPlayerCanMakeAction(map, player.position))) {
                this.updatePlayerPathTurn(accessCode, player);
                return false;
            }
            return true;
        }
    }

    private isPlayerCanMakeAction(map: Cell[][], position: Vec2): boolean {
        const directions: Vec2[] = DEFAULT_MOVEMENT_DIRECTIONS;
        for (const dir of directions) {
            const newPos: Vec2 = { x: position.x + dir.x, y: position.y + dir.y };
            if (newPos.y >= 0 && newPos.y < map.length && newPos.x >= 0 && newPos.x < map[0].length) {
                if (this.isValidCellForAction(map[newPos.y][newPos.x])) {
                    return true;
                }
            }
        }
        return false;
    }

    private isValidCellForAction(cell: Cell): boolean {
        return (cell.player !== undefined && cell.player !== Avatar.Default) || cell.tile === Tile.CLOSED_DOOR || cell.tile === Tile.OPENED_DOOR;
    }

    private findPossiblePaths(game: Cell[][], playerPosition: Vec2, movementPoints: number): Map<string, PathInfo> {
        const directions: Vec2[] = DEFAULT_MOVEMENT_DIRECTIONS;

        const visited = new Map<string, PathInfo>();
        // La file initiale contient l'état de départ avec un chemin vide et un coût nul.
        const queue: { position: Vec2; path: Vec2[]; cost: number }[] = [{ position: playerPosition, path: [], cost: 0 }];

        while (queue.length > 0) {
            const { position, path, cost } = queue.shift();
            // Si le coût dépasse, ne plus explorer.
            if (cost > movementPoints) continue;
            const key = this.vec2Key(position);

            // On stocke ou met à jour le chemin pour cette position si nous avons trouvé un meilleur moyen.
            if (!visited.has(key) || visited.get(key).cost > cost || (visited.get(key).cost === cost && visited.get(key).path.length > path.length)) {
                visited.set(key, { path, cost });
            }

            // Explorer les positions adjacentes
            for (const dir of directions) {
                const newPos: Vec2 = { x: position.x + dir.x, y: position.y + dir.y };

                if (!this.isValidPosition(game.length, newPos)) {
                    continue;
                }

                const tileCost = this.getTileCost(game[newPos.y][newPos.x]);
                if (tileCost === Infinity) {
                    continue;
                }

                const newCost = cost + tileCost;
                if (newCost > movementPoints) {
                    continue;
                }

                const newKey = this.vec2Key(newPos);
                const newPath = [...path, newPos];

                // N'ajouter dans la queue que si ce chemin améliore celui trouvé pour newPos
                if (
                    !visited.has(newKey) ||
                    visited.get(newKey).cost > newCost ||
                    (visited.get(newKey).cost === newCost && visited.get(newKey).path.length > newPath.length)
                ) {
                    queue.push({
                        position: newPos,
                        path: newPath,
                        cost: newCost,
                    });
                }
            }
        }

        // Optionnel : retirer la position de départ des résultats (on considère qu'on ne se déplace pas si aucun mouvement n'est réalisé)
        visited.delete(this.vec2Key(playerPosition));
        return visited;
    }

    private sortPlayersBySpeed(players: PlayerStats[]): PlayerStats[] {
        return players.sort((a, b) => {
            if (a.speed === b.speed) {
                return Math.random() - RANDOM_SORT_OFFSET;
            }
            return b.speed - a.speed;
        });
    }

    private getAllSpawnPoints(map: Cell[][]): Vec2[] {
        const spawnPoints: Vec2[] = [];
        map.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell.item === Item.SPAWN) {
                    spawnPoints.push({ x, y });
                }
            });
        });
        return spawnPoints;
    }

    private assignSpawnPoints(players: PlayerStats[], spawnPoints: Vec2[], map: Cell[][]): Vec2[] {
        // Mélanger les points de spawn
        const shuffledSpawnPoints = [...spawnPoints];
        for (let i = shuffledSpawnPoints.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * i);
            [shuffledSpawnPoints[i], shuffledSpawnPoints[j]] = [shuffledSpawnPoints[j], shuffledSpawnPoints[i]];
        }

        // Assigner les points et retourner ceux utilisés
        const usedSpawnPoints: Vec2[] = [];
        players.forEach((player, index) => {
            if (index < shuffledSpawnPoints.length) {
                this.eventEmitter.emit(GameEvents.AssignSpawn, { playerId: player.id, position: shuffledSpawnPoints[index] });
                player.spawnPosition = shuffledSpawnPoints[index];
                player.position = shuffledSpawnPoints[index];

                // Placer l'avatar du joueur dans la cellule
                const x = shuffledSpawnPoints[index].x;
                const y = shuffledSpawnPoints[index].y;
                map[y][x].player = player.avatar as Avatar;

                usedSpawnPoints.push(shuffledSpawnPoints[index]);
            }
        });

        return usedSpawnPoints;
    }

    private removeUnusedSpawnPoints(map: Cell[][], usedSpawnPoints: Vec2[]): void {
        // Parcourir la carte et supprimer les points de spawn non utilisés
        map.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell.item === Item.SPAWN) {
                    // Vérifier si ce spawn point est utilisé
                    const isUsed = usedSpawnPoints.some((point) => point.x === x && point.y === y);
                    if (!isUsed) {
                        cell.item = Item.DEFAULT;
                    }
                }
            });
        });
    }

    private vec2Key(vec: Vec2): string {
        return `${vec.x},${vec.y}`;
    }

    private isValidPosition(size: number, position: Vec2): boolean {
        return position.y >= 0 && position.y < size && position.x >= 0 && position.x < size;
    }

    private isOccupiedByPlayer(cell: Cell): boolean {
        return cell && cell.player !== undefined && cell.player !== Avatar.Default;
    }

    private getTileCost(cell: Cell): number {
        // Si la cellule n'existe pas, retourner un coût infini
        if (!cell) {
            return Infinity;
        }
        // Si la cellule est occupée par un joueur, elle est infranchissable
        if (this.isOccupiedByPlayer(cell)) {
            return Infinity;
        }

        // Utiliser la valeur de la constante TILE_COST pour le type de tuile
        const cost = TILE_COST.get(cell.tile);

        // Si le coût n'est pas défini pour cette tuile, utiliser le coût par défaut de la cellule
        return cost !== undefined ? cost : cell.cost;
    }
}
