import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar, Game, PathInfo, TurnInfo } from '@common/game';
import { PlayerStats } from '@common/player';
import { Injectable, Logger } from '@nestjs/common';
import { BoardService } from './board/board.service';
import { TimerService } from './timer/timer.service';

@Injectable()
export class GameService {
    private currentGames: Map<string, Game>;
    private logger: Logger = new Logger(GameService.name);

    constructor(
        private boardService: BoardService,
        private timerService: TimerService,
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
        return {
            player: playerTurn,
            path: pathInfo,
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

    movePlayer(accessCode: string, direction: Vec2) {
        const game: Game = this.currentGames.get(accessCode);
        if (game) {
            const player = game.players.find((p) => p.id === playerId);
            if (player) {}
        }
    }

    getCellAt(accessCode: string, position: Vec2): Cell {
        return this.currentGames.get(accessCode).map[position.y][position.x];
    }

    startTurn(accessCode: string) {
        this.timerService.startTimer(accessCode, 30, 'movement');
    }

    isGameAdmin(accessCode: string, playerId: string) {
        return this.currentGames.get(accessCode).organizerId === playerId;
    }

    getPlayerTurn(accessCode: string): string {
        const game = this.currentGames.get(accessCode);
        return game ? game.players[game.currentTurn].id : undefined;
    }

    private sortPlayersBySpeed(players: PlayerStats[]): PlayerStats[] {
        return players.sort((a, b) => b.speed - a.speed);
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

    private findPossiblePath(currentPlayer: playerInfo, map: Cell[][]): Map<Vec2, PathInfo> {
        const { costMap, predecessor, queue } = this.initializePathFindingData(currentPlayer);

        this.processCellQueue(queue, costMap, predecessor, currentPlayer, map);

        return this.buildPathInfoMap(costMap, predecessor);
    }

    private initializePathFindingData(currentPlayer: PlayerStats): {
        costMap: Map<string, number>;
        predecessor: Map<string, string>;
        queue: { position: Vec2; cost: number }[];
    } {
        const costMap = new Map<string, number>();
        const predecessor = new Map<string, string>();
        const queue: { position: Vec2; cost: number }[] = [];

        const start = currentPlayer.position;
        const startKey = this.keyFromVec2(start);
        costMap.set(startKey, 0);
        queue.push({ position: start, cost: 0 });

        return { costMap, predecessor, queue };
    }

    // --- Traitement de la file de priorité ---
    private processCellQueue(
        queue: { position: Vec2; cost: number }[],
        costMap: Map<string, number>,
        predecessor: Map<string, string>,
        currentPlayer: PlayerStats,
        map: Cell[][],
    ): void {
        const visited = new Set<string>();
        const movementPoints = currentPlayer.movementPts;

        while (queue.length > 0) {
            queue.sort((a, b) => a.cost - b.cost);
            const current = queue.shift();
            const currentKey = this.keyFromVec2(current.position);

            if (visited.has(currentKey) || current.cost > movementPoints) {
                continue;
            }

            visited.add(currentKey);

            const neighbors = this.getNeighbors(current.position, map);
            for (const neighbor of neighbors) {
                const neighborKey = this.keyFromVec2(neighbor);
                if (visited.has(neighborKey)) {
                    continue;
                }

                const cell = map[neighbor.y][neighbor.x];
                if (cell.player !== Avatar.Default) {
                    continue;
                }

                const newCost = current.cost + this.calculateMovementCost(cell);
                if (!costMap.has(neighborKey) || newCost < costMap.get(neighborKey)) {
                    costMap.set(neighborKey, newCost);
                    predecessor.set(neighborKey, currentKey);

                    if (newCost <= movementPoints) {
                        queue.push({ position: neighbor, cost: newCost });
                    }
                }
            }
        }
    }

    // --- Construction de la map finale (Map<Vec2, PathInfo>) ---
    private buildPathInfoMap(costMap: Map<string, number>, predecessor: Map<string, string>): Map<Vec2, PathInfo> {
        const result = new Map<Vec2, PathInfo>();
        costMap.forEach((cost, key) => {
            const destination = this.vec2FromKey(key);
            const path = this.reconstructPath(key, predecessor);
            result.set(destination, { path, cost });
        });
        return result;
    }

    // --- Reconstruit le chemin complet en partant d'une clé cible en utilisant la map des prédécesseurs ---
    private reconstructPath(targetKey: string, predecessor: Map<string, string>): Vec2[] {
        const path: Vec2[] = [];
        let currentKey: string = targetKey;
        while (currentKey) {
            path.unshift(this.vec2FromKey(currentKey));
            currentKey = predecessor.get(currentKey);
            if (!currentKey) break;
        }
        return path;
    }

    // --- Fonctions utilitaires de conversion entre Vec2 et string ---
    private keyFromVec2(vec: Vec2): string {
        return `${vec.x},${vec.y}`;
    }

    private vec2FromKey(key: string): Vec2 {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
    }

    // --- Obtient les cellules voisines (4 directions) ---
    private getNeighbors(position: Vec2, map: Cell[][]): Vec2[] {
        const neighbors: Vec2[] = [];
        const directions = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
        ];
        for (const dir of directions) {
            const next: Vec2 = { x: position.x + dir.x, y: position.y + dir.y };
            if (next.x >= 0 && next.x < map[0].length && next.y >= 0 && next.y < map.length) {
                neighbors.push(next);
            }
        }
        return neighbors;
    }

    // --- Vérifie si une cellule est accessible ---
    // Les tuiles WALL et CLOSED_DOOR ont un coût infini et sont donc inaccessibles.
    private isCellAccessible(cell: Cell): boolean {
        return cell.player === Avatar.Default || cell.item !== Item.DEFAULT;
    }

    // --- Calcule le coût de déplacement vers une cellule ---
    // Les tuiles WALL et CLOSED_DOOR renvoient un coût infini.
    private calculateMovementCost(cell: Cell): number {
        if (cell.tile === Tile.WALL || cell.tile === Tile.CLOSED_DOOR) {
            return Infinity;
        }
        return cell.cost; // On suppose que la valeur cost est renseignée dans cell
    }
}
