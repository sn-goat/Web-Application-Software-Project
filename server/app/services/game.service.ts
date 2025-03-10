import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Game, Avatar } from '@common/game';
import { PlayerStats } from '@common/player';
import { Injectable, Logger } from '@nestjs/common';
import { BoardService } from './board/board.service';

@Injectable()
export class GameService {
    private currentGames: Map<string, Game>;
    private logger: Logger = new Logger(GameService.name);

    constructor(private boardService: BoardService) {
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
        if (cell.tile === Tile.CLOSED_DOOR) {
            cell.tile = Tile.OPENED_DOOR;
        } else if (cell.tile === Tile.OPENED_DOOR) {
            cell.tile = Tile.CLOSED_DOOR;
        }
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

    async createGame(accessCode: string, organizerId: string, map: string) {
        const board = await this.boardService.getBoard(map);
        if (!board) {
            this.logger.error('Board not found');
            throw new Error('Board not found');
        } else {
            this.logger.log('Cell: ' + board.board[0][0].tile);
            this.currentGames.set(accessCode, {
                organizerId,
                players: [],
                map: board.board,
                currentTurn: 0,
                isDebugMode: false,
            });
        }
    }

    async quitGame(accessCode: string, playerId: string) {
        const game = this.currentGames.get(accessCode);
        if (game) {
            const index = game.players.findIndex((player) => player.id === playerId);

            if (index >= 0) {
                const player = game.players[index];
                if (player.id === game.organizerId) {
                    for (let i = game.players.length - 1; i >= 0; i--) {
                        const p = game.players[i];
                        this.logger.log(`Player ${p.id} quit the game`);
                        game.map[p.position.y][p.position.x].player = Avatar.Default;
                        game.players.splice(i, 1);
                    }
                    this.currentGames.delete(accessCode);
                    this.logger.log(`Game ${accessCode} deleted`);
                } else {
                    game.map[player.position.y][player.position.x].player = Avatar.Default;
                    game.players.splice(index, 1);
                    this.logger.log(`Player ${playerId} quit the game`);
                }
            }
            return game;
        }
        return null;
    }

    getCellAt(accessCode: string, position: Vec2): Cell {
        return this.currentGames.get(accessCode).map[position.y][position.x];
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
}
