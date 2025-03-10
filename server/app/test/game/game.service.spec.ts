/* eslint-disable @typescript-eslint/no-explicit-any */
import { GameService } from '@app/services/game.service';
import { BoardService } from '@app/services/board/board.service';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Game } from '@common/game';
import { PlayerStats } from '@common/player';
import { Logger } from '@nestjs/common';

describe('GameService', () => {
    let gameService: GameService;
    let boardService: Partial<BoardService>;
    let dummyBoard: any;
    let dummyMap: Cell[][];
    const accessCode = 'GAME123';

    beforeEach(() => {
        dummyMap = [
            [
                { tile: Tile.CLOSED_DOOR, item: Item.DEFAULT, position: { x: 0, y: 0 }, cost: 1, player: null },
                { tile: Tile.FLOOR, item: Item.SPAWN, position: { x: 1, y: 0 }, cost: 1, player: null },
            ],
            [
                { tile: Tile.FLOOR, item: Item.SPAWN, position: { x: 0, y: 1 }, cost: 1, player: null },
                { tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 0, y: 0 }, cost: 1, player: null },
            ],
        ];

        dummyBoard = { board: dummyMap };
        boardService = {
            getBoard: jest.fn().mockResolvedValue(dummyBoard),
        };

        gameService = new GameService(boardService as BoardService);

        jest.spyOn(Logger.prototype, 'log').mockImplementation();
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
    });

    describe('changeDebugState', () => {
        it('should toggle debug mode and return the new state', () => {
            gameService['currentGames'].set(accessCode, {
                organizerId: 'org1',
                players: [],
                map: dummyMap,
                currentTurn: 0,
                isDebugMode: false,
            });

            const newState = gameService.changeDebugState(accessCode);
            expect(newState).toBe(true);
            expect(gameService['currentGames'].get(accessCode).isDebugMode).toBe(true);

            const newState2 = gameService.changeDebugState(accessCode);
            expect(newState2).toBe(false);
            expect(gameService['currentGames'].get(accessCode).isDebugMode).toBe(false);
        });
    });

    describe('changeDoorState', () => {
        it('should change a CLOSED_DOOR to an OPENED_DOOR and vice versa', () => {
            const mapCopy: Cell[][] = [
                [
                    { tile: Tile.CLOSED_DOOR, item: Item.DEFAULT, position: { x: 0, y: 0 }, cost: 1, player: null },
                    { tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 0, y: 0 }, cost: 1, player: null },
                ],
            ];
            gameService['currentGames'].set(accessCode, {
                organizerId: 'org1',
                players: [],
                map: mapCopy,
                currentTurn: 0,
                isDebugMode: false,
            });
            const pos: Vec2 = { x: 0, y: 0 };

            const cell = gameService.changeDoorState(accessCode, pos);
            expect(cell.tile).toBe(Tile.OPENED_DOOR);

            const cell2 = gameService.changeDoorState(accessCode, pos);
            expect(cell2.tile).toBe(Tile.CLOSED_DOOR);
        });
    });

    describe('configureGame', () => {
        it('should configure a game by sorting players, assigning spawn points, and removing unused spawns', () => {
            const players: PlayerStats[] = [
                { id: 'p1', name: 'Player1', speed: 5, avatar: 'avatar1' } as PlayerStats,
                { id: 'p2', name: 'Player2', speed: 10, avatar: 'avatar2' } as PlayerStats,
                { id: 'p3', name: 'Player3', speed: 7, avatar: 'avatar3' } as PlayerStats,
            ];

            const gameMap: Cell[][] = [
                [
                    { tile: Tile.FLOOR, item: Item.SPAWN, position: { x: 0, y: 0 }, cost: 1, player: null },
                    { tile: Tile.FLOOR, item: Item.SPAWN, position: { x: 1, y: 0 }, cost: 1, player: null },
                ],
                [
                    { tile: Tile.FLOOR, item: Item.SPAWN, position: { x: 0, y: 2 }, cost: 1, player: null },
                    { tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 0, y: 0 }, cost: 1, player: null },
                ],
            ];
            const game: Game = {
                organizerId: 'org1',
                players: [],
                map: gameMap,
                currentTurn: 0,
                isDebugMode: false,
            };

            gameService['currentGames'].set(accessCode, game);

            const configuredGame = gameService.configureGame(accessCode, players);
            expect(configuredGame).not.toBeNull();

            expect(configuredGame.players[0].id).toBe('p2');
            expect(configuredGame.players[1].id).toBe('p3');
            expect(configuredGame.players[2].id).toBe('p1');

            configuredGame.players.forEach((player) => {
                expect(player.spawnPosition).toBeDefined();
                expect(player.position).toBeDefined();
                const cell = configuredGame.map[player.spawnPosition.y][player.spawnPosition.x];
                expect(cell.player).toBe(player.avatar);
            });

            configuredGame.map.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell.item === Item.SPAWN) {
                        const used = configuredGame.players.some((p) => p.spawnPosition.x === x && p.spawnPosition.y === y);
                        if (!used) {
                            expect(cell.item).toBe(Item.DEFAULT);
                        }
                    }
                });
            });
        });

        it('should remove unused spawn points from the map', () => {
            const originalMathRandom = Math.random;
            Math.random = () => 0;

            const players: PlayerStats[] = [{ id: 'p1', name: 'Player1', speed: 5, avatar: 'avatar1' } as PlayerStats];

            const gameMap: Cell[][] = [
                [
                    { tile: Tile.FLOOR, item: Item.SPAWN, position: { x: 0, y: 0 }, cost: 1, player: null },
                    { tile: Tile.FLOOR, item: Item.SPAWN, position: { x: 1, y: 0 }, cost: 1, player: null },
                ],
                [
                    { tile: Tile.FLOOR, item: Item.SPAWN, position: { x: 0, y: 1 }, cost: 1, player: null },
                    { tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 1, y: 1 }, cost: 1, player: null },
                ],
            ];
            const game: Game = {
                organizerId: 'org1',
                players: [],
                map: gameMap,
                currentTurn: 0,
                isDebugMode: false,
            };

            gameService['currentGames'].set(accessCode, game);

            const configuredGame = gameService.configureGame(accessCode, players);
            expect(configuredGame).not.toBeNull();
            expect(configuredGame.map[0][0].item).toBe(Item.DEFAULT);
            expect(configuredGame.map[0][1].item).toBe(Item.SPAWN);
            expect(configuredGame.map[1][0].item).toBe(Item.DEFAULT);
            Math.random = originalMathRandom;
        });

        it('should return null if no game exists for the given access code', () => {
            const result = gameService.configureGame(accessCode, []);
            expect(result).toBeNull();
        });
    });

    describe('createGame', () => {
        it('should throw an error if boardService.getBoard returns null', async () => {
            (boardService.getBoard as jest.Mock).mockResolvedValue(null);
            await expect(gameService.createGame(accessCode, 'org1', 'nonexistentMap')).rejects.toThrow('Board not found');
        });

        it('should create and store a new game if boardService.getBoard returns a valid board', async () => {
            await gameService.createGame(accessCode, 'org1', 'dummyMap');
            const game = gameService['currentGames'].get(accessCode);
            expect(game).toBeDefined();
            expect(game.organizerId).toBe('org1');
            expect(game.players).toEqual([]);
            expect(game.map).toEqual(dummyMap);
            expect(game.currentTurn).toBe(0);
            expect(game.isDebugMode).toBe(false);
        });
    });

    describe('getCellAt', () => {
        it('should return the correct cell from the game map', () => {
            const customMap: Cell[][] = [
                [
                    { tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 0, y: 0 }, cost: 1, player: null },
                    { tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 1, y: 0 }, cost: 1, player: null },
                ],
                [
                    { tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 0, y: 1 }, cost: 1, player: null },
                    { tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 1, y: 1 }, cost: 1, player: null },
                ],
            ];
            gameService['currentGames'].set(accessCode, {
                organizerId: 'org1',
                players: [],
                map: customMap,
                currentTurn: 0,
                isDebugMode: false,
            });
            const pos: Vec2 = { x: 1, y: 0 };
            const cell = gameService.getCellAt(accessCode, pos);
            expect(cell).toEqual(customMap[0][1]);
        });
    });
});
