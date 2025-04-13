/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GameStatsUtils } from '@app/services/game/game-utils-stats';
import { Vec2 } from '@common/board';
import { Item } from '@common/enums';
import { GameStats } from '@common/game';
import { PlayerStats } from '@common/player';
import { mockDisconnectedPlayerStats, mockGameStats, mockPlayerStats } from '@common/stats';

describe('GameStatsUtils', () => {
    let playerStats: PlayerStats[];
    let gameStats: GameStats;

    beforeEach(() => {
        playerStats = JSON.parse(JSON.stringify(mockPlayerStats));
        playerStats.forEach((player) => {
            player.itemsPicked = new Set(player.itemsPicked ? Array.from(player.itemsPicked) : []);
            player.tilesVisited = new Set(player.tilesVisited ? Array.from(player.tilesVisited) : []);
        });

        gameStats = JSON.parse(JSON.stringify(mockGameStats));
        gameStats.tilesVisited = new Set(gameStats.tilesVisited ? Array.from(gameStats.tilesVisited) : []);
        gameStats.doorsHandled = new Set(gameStats.doorsHandled ? Array.from(gameStats.doorsHandled) : []);
        gameStats.flagsCaptured = new Set(gameStats.flagsCaptured ? Array.from(gameStats.flagsCaptured) : []);
        gameStats.timeStartOfGame = new Date(gameStats.timeStartOfGame);
        gameStats.timeEndOfGame = new Date(gameStats.timeEndOfGame);
    });

    describe('calculateStats', () => {
        it('should calculate stats correctly for players and game', () => {
            const stats = GameStatsUtils.calculateStats(playerStats, gameStats);

            expect(stats).toBeDefined();
            expect(stats.playersStats).toHaveLength(mockPlayerStats.length);
            expect(stats.disconnectedPlayersStats).toHaveLength(0);

            const johnStats = stats.playersStats.find((p) => p.name === 'John Doe');
            expect(johnStats?.totalFights).toBe(6);
            expect(johnStats?.itemsPickedCount).toBe(0);
            expect(johnStats?.tilesVisitedPercentage).toBe('0%');

            expect(stats.gameStats.doorsHandledPercentage).toBe('0%');
            expect(stats.gameStats.gameDuration).toBe('15:42');
            expect(stats.gameStats.flagsCapturedCount).toBe(undefined);

            expect(() => JSON.stringify(stats)).not.toThrow();
        });

        it('should handle disconnected players correctly', () => {
            const disconnectedPlayers = JSON.parse(JSON.stringify(mockDisconnectedPlayerStats));
            disconnectedPlayers.forEach((player) => {
                player.itemsPicked = new Set(player.itemsPicked ? Array.from(player.itemsPicked) : []);
                player.tilesVisited = new Set(player.tilesVisited ? Array.from(player.tilesVisited) : []);
            });

            gameStats.disconnectedPlayers = disconnectedPlayers;

            const stats = GameStatsUtils.calculateStats(playerStats, gameStats);

            expect(stats.disconnectedPlayersStats).toHaveLength(1);
            expect(stats.disconnectedPlayersStats[0].name).toBe('Jojo Martin');
            expect(stats.disconnectedPlayersStats[0].totalFights).toBe(1);
        });
    });

    describe('Private methods', () => {
        describe('calculateGameDuration', () => {
            it('should format game duration correctly', () => {
                const testGameStats = { ...gameStats };

                (GameStatsUtils as any).calculateGameDuration(testGameStats);

                expect(testGameStats.gameDuration).toBe('15:42');
                expect(testGameStats.timeStartOfGame).toBeUndefined();
                expect(testGameStats.timeEndOfGame).toBeUndefined();
            });

            it('should pad minutes and seconds with zeros when less than 10', () => {
                const testGameStats = {
                    timeStartOfGame: new Date('2023-04-13T10:00:00'),
                    timeEndOfGame: new Date('2023-04-13T10:05:09'),
                } as GameStats;

                (GameStatsUtils as any).calculateGameDuration(testGameStats);

                expect(testGameStats.gameDuration).toBe('05:09');
            });
        });

        describe('calculatePlayersStats', () => {
            it('should calculate totalFights correctly', () => {
                const player: PlayerStats = {
                    name: 'Test Player',
                    wins: 3,
                    losses: 2,
                    fleeSuccess: 1,
                    totalFights: 0,
                    itemsPicked: new Set(),
                    tilesVisited: new Set(),
                    itemsPickedCount: 0,
                    tilesVisitedPercentage: '',
                    givenDamage: 0,
                    takenDamage: 0,
                };

                const result = (GameStatsUtils as any).calculatePlayersStats([player], 100);

                expect(result[0].totalFights).toBe(6);
            });

            it('should calculate itemsPickedCount correctly', () => {
                const player: PlayerStats = {
                    name: 'Test Player',
                    itemsPicked: new Set([Item.Shield, Item.Sword, Item.Pearl]),
                    itemsPickedCount: 0,
                    wins: 0,
                    losses: 0,
                    fleeSuccess: 0,
                    totalFights: 0,
                    tilesVisited: new Set(),
                    tilesVisitedPercentage: '',
                    givenDamage: 0,
                    takenDamage: 0,
                };

                const result = (GameStatsUtils as any).calculatePlayersStats([player], 100);

                expect(result[0].itemsPickedCount).toBe(3);
            });

            it('should calculate tilesVisitedPercentage correctly', () => {
                const player: PlayerStats = {
                    name: 'Test Player',
                    tilesVisited: new Set<Vec2>([
                        { x: 1, y: 1 },
                        { x: 2, y: 2 },
                    ]),
                    tilesVisitedPercentage: '',
                    itemsPicked: new Set(),
                    itemsPickedCount: 0,
                    wins: 0,
                    losses: 0,
                    fleeSuccess: 0,
                    totalFights: 0,
                    givenDamage: 0,
                    takenDamage: 0,
                };

                const result = (GameStatsUtils as any).calculatePlayersStats([player], 100);

                expect(result[0].tilesVisitedPercentage).toBe('2%');
            });
        });

        describe('addVisitedTileToGameStats', () => {
            it('should add player tiles to game stats', () => {
                const testGameStats: GameStats = {
                    tilesVisited: new Set<Vec2>(),
                } as GameStats;

                const testPlayerStats: PlayerStats[] = [
                    {
                        name: 'Test Player',
                        tilesVisited: new Set<Vec2>([
                            { x: 1, y: 1 },
                            { x: 2, y: 2 },
                        ]),
                        wins: 0,
                        losses: 0,
                        fleeSuccess: 0,
                        totalFights: 0,
                        itemsPicked: new Set(),
                        itemsPickedCount: 0,
                        tilesVisitedPercentage: '',
                        givenDamage: 0,
                        takenDamage: 0,
                    },
                ];

                (GameStatsUtils as any).addVisitedTileToGameStats(testPlayerStats, testGameStats);

                expect(testGameStats.tilesVisited.size).toBe(2);
                expect(testPlayerStats[0].tilesVisited).toBeUndefined();
            });

            it('should handle multiple players correctly', () => {
                const testGameStats: GameStats = {
                    tilesVisited: new Set<Vec2>(),
                } as GameStats;

                const testPlayerStats: PlayerStats[] = [
                    {
                        name: 'Player1',
                        tilesVisited: new Set<Vec2>([{ x: 1, y: 1 }]),
                        wins: 0,
                        losses: 0,
                        fleeSuccess: 0,
                        totalFights: 0,
                        itemsPicked: new Set(),
                        itemsPickedCount: 0,
                        tilesVisitedPercentage: '',
                        givenDamage: 0,
                        takenDamage: 0,
                    },
                    {
                        name: 'Player2',
                        tilesVisited: new Set<Vec2>([{ x: 2, y: 2 }]),
                        wins: 0,
                        losses: 0,
                        fleeSuccess: 0,
                        totalFights: 0,
                        itemsPicked: new Set(),
                        itemsPickedCount: 0,
                        tilesVisitedPercentage: '',
                        givenDamage: 0,
                        takenDamage: 0,
                    },
                ];

                (GameStatsUtils as any).addVisitedTileToGameStats(testPlayerStats, testGameStats);

                expect(testGameStats.tilesVisited.size).toBe(2);
            });
        });

        describe('addFlagsCapturedToGameStats', () => {
            it('should add flag captures to game stats', () => {
                const testGameStats: GameStats = {
                    flagsCaptured: new Set<string>(),
                } as GameStats;

                const testPlayerStats: PlayerStats[] = [
                    {
                        name: 'FlagCapturer',
                        itemsPicked: new Set([Item.Flag, Item.Shield]),
                        wins: 0,
                        losses: 0,
                        fleeSuccess: 0,
                        totalFights: 0,
                        tilesVisited: new Set(),
                        itemsPickedCount: 0,
                        tilesVisitedPercentage: '',
                        givenDamage: 0,
                        takenDamage: 0,
                    },
                ];

                (GameStatsUtils as any).addFlagsCapturedToGameStats(testPlayerStats, testGameStats);

                expect(testGameStats.flagsCaptured.size).toBe(1);
                expect(testGameStats.flagsCaptured.has('FlagCapturer')).toBe(true);
                expect(testPlayerStats[0].itemsPicked).toBeUndefined();
            });

            it('should handle players without flags correctly', () => {
                const testGameStats: GameStats = {
                    flagsCaptured: new Set<string>(),
                } as GameStats;

                const testPlayerStats: PlayerStats[] = [
                    {
                        name: 'NonFlagCapturer',
                        itemsPicked: new Set([Item.Shield, Item.Sword]),
                        wins: 0,
                        losses: 0,
                        fleeSuccess: 0,
                        totalFights: 0,
                        tilesVisited: new Set(),
                        itemsPickedCount: 0,
                        tilesVisitedPercentage: '',
                        givenDamage: 0,
                        takenDamage: 0,
                    },
                ];

                (GameStatsUtils as any).addFlagsCapturedToGameStats(testPlayerStats, testGameStats);

                expect(testGameStats.flagsCaptured.size).toBe(0);
                expect(testPlayerStats[0].itemsPicked).toBeUndefined();
            });
        });

        describe('calculateGameStats', () => {
            it('should calculate game stats correctly', () => {
                const testGameStats = {
                    tilesVisited: new Set<Vec2>([
                        { x: 1, y: 1 },
                        { x: 2, y: 2 },
                    ]),
                    doorsHandled: new Set<Vec2>([{ x: 3, y: 3 }]),
                    flagsCaptured: new Set<string>(['Player1']),
                    tilesNumber: 100,
                    doorsNumber: 5,
                    timeStartOfGame: new Date('2023-04-13T10:00:00'),
                    timeEndOfGame: new Date('2023-04-13T10:15:30'),
                    disconnectedPlayers: [],
                    tilesVisitedPercentage: '',
                    doorsHandledPercentage: '',
                    gameDuration: '',
                    flagsCapturedCount: 0,
                } as GameStats;

                const testPlayerStats: PlayerStats[] = [
                    {
                        name: 'Player1',
                        tilesVisited: new Set<Vec2>([{ x: 3, y: 3 }]),
                        itemsPicked: new Set([Item.Flag]),
                        wins: 0,
                        losses: 0,
                        fleeSuccess: 0,
                        totalFights: 0,
                        itemsPickedCount: 0,
                        tilesVisitedPercentage: '',
                        givenDamage: 0,
                        takenDamage: 0,
                    },
                ];

                const result = (GameStatsUtils as any).calculateGameStats(testGameStats, testPlayerStats);

                expect(result.tilesVisitedPercentage).toBe('3%');
                expect(result.doorsHandledPercentage).toBe('20%');
                expect(result.gameDuration).toBe('15:30');
                expect(result.flagsCapturedCount).toBe(1);

                expect(result.tilesVisited).toBeUndefined();
                expect(result.doorsHandled).toBeUndefined();
                expect(result.flagsCaptured).toBeUndefined();
            });

            it('should handle disconnected players correctly', () => {
                const disconnectedPlayer = {
                    name: 'Disconnected',
                    tilesVisited: new Set<Vec2>([{ x: 4, y: 4 }]),
                    itemsPicked: new Set([Item.Flag]),
                    wins: 0,
                    losses: 0,
                    fleeSuccess: 0,
                    totalFights: 0,
                    itemsPickedCount: 0,
                    tilesVisitedPercentage: '',
                    givenDamage: 0,
                    takenDamage: 0,
                };

                const testGameStats = {
                    tilesVisited: new Set<Vec2>([{ x: 1, y: 1 }]),
                    doorsHandled: new Set<Vec2>(),
                    flagsCaptured: new Set<string>(),
                    tilesNumber: 100,
                    doorsNumber: 5,
                    timeStartOfGame: new Date('2023-04-13T10:00:00'),
                    timeEndOfGame: new Date('2023-04-13T10:20:30'),
                    disconnectedPlayers: [disconnectedPlayer],
                    tilesVisitedPercentage: '',
                    doorsHandledPercentage: '',
                    gameDuration: '',
                    flagsCapturedCount: 0,
                } as GameStats;

                const result = (GameStatsUtils as any).calculateGameStats(testGameStats, []);

                expect(result.tilesVisitedPercentage).toBe('2%');
                expect(result.flagsCapturedCount).toBe(1);
            });

            it('should handle no flags captured correctly', () => {
                const testGameStats = {
                    tilesVisited: new Set<Vec2>(),
                    doorsHandled: new Set<Vec2>(),
                    flagsCaptured: new Set<string>(),
                    tilesNumber: 100,
                    doorsNumber: 5,
                    timeStartOfGame: new Date('2023-04-13T10:00:00'),
                    timeEndOfGame: new Date('2023-04-13T10:20:30'),
                    disconnectedPlayers: [],
                    tilesVisitedPercentage: '',
                    doorsHandledPercentage: '',
                    gameDuration: '',
                    flagsCapturedCount: 0,
                } as GameStats;

                const result = (GameStatsUtils as any).calculateGameStats(testGameStats, []);

                expect(result.flagsCapturedCount).toBeUndefined();
            });

            it('should handle empty collections correctly', () => {
                const testGameStats = {
                    tilesVisited: new Set<Vec2>(),
                    doorsHandled: new Set<Vec2>(),
                    flagsCaptured: new Set<string>(),
                    tilesNumber: 100,
                    doorsNumber: 5,
                    timeStartOfGame: new Date('2023-04-13T10:00:00'),
                    timeEndOfGame: new Date('2023-04-13T10:20:30'),
                    disconnectedPlayers: [],
                    tilesVisitedPercentage: '',
                    doorsHandledPercentage: '',
                    gameDuration: '',
                    flagsCapturedCount: 0,
                } as GameStats;

                const result = (GameStatsUtils as any).calculateGameStats(testGameStats, []);

                expect(result.tilesVisitedPercentage).toBe('0%');
                expect(result.doorsHandledPercentage).toBe('0%');
            });
        });
    });
});
