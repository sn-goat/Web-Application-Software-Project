import { MOVEMENT_TIMEOUT_IN_MS, RANDOM_SORT_OFFSET, TURN_DURATION_IN_S } from '@app/gateways/game/game.gateway.constants';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar, Game, PathInfo, TurnInfo } from '@common/game';
import { TurnEvents } from '@common/game.gateway.events';
import { PlayerStats } from '@common/player';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BoardService } from './board/board.service';
import { TimerService } from './timer/timer.service';

@Injectable()
export class GameService {
    private currentGames: Map<string, Game>;
    private logger: Logger = new Logger(GameService.name);

    constructor(
        private boardService: BoardService,
        private timerService: TimerService,
        private eventEmitter: EventEmitter2,
    ) {
        this.currentGames = new Map();
    }

    changeDebugState(accessCode: string) {
        this.currentGames.get(accessCode).isDebugMode = !this.currentGames.get(accessCode).isDebugMode;
        return this.currentGames.get(accessCode).isDebugMode;
    }

    // playerAttack(accessCode: string, playerId: string) {
    //     throw new Error('Method not implemented.');
    // }

    // playerFlee(accessCode: string, playerId: string) {
    //     throw new Error('Method not implemented.');
    // }

    // initFight(accessCode: string, playerId: string, enemyPosition: Vec2) {
    //     throw new Error('Method not implemented.');
    // }

    // movePlayer(accessCode: string, playerId: string, direction: Vec2) {
    //     throw new Error('Method not implemented.');
    // }
    changeDoorState(accessCode: string, position: Vec2) {
        const cell: Cell = this.getCellAt(accessCode, position);
        cell.tile = cell.tile === Tile.CLOSED_DOOR ? Tile.OPENED_DOOR : Tile.CLOSED_DOOR;
        return cell;
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

    configureTurn(accessCode: string): TurnInfo {
        const playerTurn = this.getPlayerTurn(accessCode);
        playerTurn.movementPts = playerTurn.speed;
        playerTurn.actions = 1;
        return {
            player: playerTurn,
            path: this.findPossiblePaths(this.currentGames.get(accessCode).map, playerTurn.position, playerTurn.movementPts),
        };
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

    processPath(accessCode: string, path: Vec2[]) {
        const game = this.currentGames.get(accessCode);
        if (game) {
            const activePlayer = this.getPlayerTurn(accessCode);
            if (activePlayer) {
                this.logger.log(`Processing path for player ${activePlayer.id}`);
                let index = 0;
                const interval = setInterval(() => {
                    if (index < path.length) {
                        this.movePlayer(accessCode, game.map, activePlayer.position, path[index]);
                        activePlayer.position = path[index];
                        index++;
                    } else {
                        clearInterval(interval);
                    }
                }, MOVEMENT_TIMEOUT_IN_MS);
            }
        }
    }

    getCellAt(accessCode: string, position: Vec2): Cell {
        return this.currentGames.get(accessCode).map[position.y][position.x];
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

    switchTurn(accessCode: string) {
        const game = this.currentGames.get(accessCode);
        if (game) {
            game.currentTurn = (game.currentTurn + 1) % game.players.length;
            this.logger.log(`Switching turn to player ${game.players[game.currentTurn].id}`);
        }
    }

    private findPossiblePaths(game: Cell[][], playerPosition: Vec2, movementPoints: number): Map<string, PathInfo> {
        const directions: Vec2[] = [
            { x: 0, y: 1 }, // Down
            { x: 1, y: 0 }, // Right
            { x: 0, y: -1 }, // Up
            { x: -1, y: 0 }, // Left
        ];

        const queue: { position: Vec2; path: Vec2[]; remainingPoints: number }[] = [
            { position: playerPosition, path: [playerPosition], remainingPoints: movementPoints },
        ];
        const visited = new Map<string, PathInfo>();

        while (queue.length > 0) {
            const { position, path, remainingPoints } = queue.shift();
            const key = this.vec2Key(position);

            if (!visited.has(key) || visited.get(key).path.length > path.length) {
                visited.set(key, { path, cost: movementPoints - remainingPoints });

                for (const dir of directions) {
                    const newPos: Vec2 = { x: position.x + dir.x, y: position.y + dir.y };
                    if (this.isValidPosition(game.length, newPos)) {
                        const moveCost = this.getTileCost(game[newPos.x][newPos.y]);
                        if (remainingPoints >= moveCost && moveCost !== Infinity) {
                            queue.push({
                                position: newPos,
                                path: [...path, newPos],
                                remainingPoints: remainingPoints - moveCost,
                            });
                        }
                    }
                }
            }
        }
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
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledSpawnPoints[i], shuffledSpawnPoints[j]] = [shuffledSpawnPoints[j], shuffledSpawnPoints[i]];
        }

        // Assigner les points et retourner ceux utilisés
        const usedSpawnPoints: Vec2[] = [];
        players.forEach((player, index) => {
            if (index < shuffledSpawnPoints.length) {
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

    /**
     * Convert a Vec2 to a string key for use in maps.
     */
    private vec2Key(vec: Vec2): string {
        return `${vec.x},${vec.y}`;
    }

    /**
     * Check if a position is within the grid bounds.
     */
    private isValidPosition(size: number, position: Vec2): boolean {
        return position.y >= 0 && position.y < size && position.x >= 0 && position.x < size;
    }

    /**
     * Check if a position is occupied by another player.
     */
    private isOccupiedByPlayer(cell: Cell): boolean {
        if (!cell) {
            return false;
        }
        return cell.player !== Avatar.Default && cell.player !== null;
    }

    /**
     * Get the movement cost for a tile at a given position.
     */
    private getTileCost(cell: Cell): number {
        if (!cell) {
            return Infinity;
        }
        if (this.isOccupiedByPlayer(cell)) {
            return Infinity;
        }
        return cell.cost;
    }

    private movePlayer(accessCode: string, map: Cell[][], position: Vec2, direction: Vec2): void {
        this.logger.log(`Player moved from ${position.x},${position.y} to ${direction.x},${direction.y}`);
        this.eventEmitter.emit(TurnEvents.Move, { accessCode, position, direction });
        map[position.y][position.x].player = Avatar.Default;
        map[direction.y][direction.x].player = this.getPlayerTurn(accessCode).avatar as Avatar;
    }
}
