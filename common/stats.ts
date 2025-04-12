import { PlayerStats } from './player';
import { GameStats } from './game';
import { Item } from '@common/enums';

export interface Stats {
    playersStats: PlayerStats[];
    disconnectedPlayersStats: PlayerStats[];
    gameStats: GameStats;
}

export type StatPlayer = PlayerStats & { isDisconnected: boolean };


export const mockPlayerStats: PlayerStats[] = [
    {
        name: 'John Doe',
        takenDamage: 35,
        givenDamage: 50,
        itemsPicked: new Set([Item.Chest, Item.Sword]),
        itemsPickedCount: 2,
        tilesVisited: new Set([
            { x: 1, y: 1 },
            { x: 1, y: 2 },
            { x: 2, y: 2 },
        ]),
        tilesVisitedPercentage: '15%',
        wins: 3,
        losses: 1,
        fleeSuccess: 2,
        totalFights: 6,
    },
    {
        name: 'Jane Smith',
        takenDamage: 20,
        givenDamage: 40,
        itemsPicked: new Set([Item.LeatherBoot]),
        itemsPickedCount: 1,
        tilesVisited: new Set([
            { x: 3, y: 3 },
            { x: 3, y: 4 },
            { x: 4, y: 4 },
            { x: 5, y: 4 },
        ]),
        tilesVisitedPercentage: '20%',
        wins: 2,
        losses: 0,
        fleeSuccess: 1,
        totalFights: 3,
    },
    {
        name: 'Bob Johnson',
        takenDamage: 45,
        givenDamage: 30,
        itemsPicked: new Set([Item.Pearl, Item.Shield]),
        itemsPickedCount: 2,
        tilesVisited: new Set([
            { x: 5, y: 5 },
            { x: 6, y: 5 },
        ]),
        tilesVisitedPercentage: '10%',
        wins: 1,
        losses: 2,
        fleeSuccess: 0,
        totalFights: 3,
    },
];

export const mockDisconnectedPlayerStats: PlayerStats[] = [
    {
        name: 'Jojo Martin',
        takenDamage: 15,
        givenDamage: 10,
        itemsPicked: new Set([Item.Chest]),
        itemsPickedCount: 0,
        tilesVisited: new Set([{ x: 7, y: 7 }]),
        tilesVisitedPercentage: '5%',
        wins: 0,
        losses: 1,
        fleeSuccess: 0,
        totalFights: 1,
    },
];

export const mockGameStats: GameStats = {
    gameDuration: '15:42',
    tilesVisitedPercentage: '38%',
    tilesVisited: new Set([
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
        { x: 3, y: 4 },
        { x: 4, y: 4 },
        { x: 5, y: 4 },
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 7 },
    ]),
    doorsHandled: new Set([
        { x: 2, y: 3 },
        { x: 4, y: 5 },
    ]),
    doorsHandledPercentage: '40%',
    flagsCaptured: new Set(['player123']),
    flagsCapturedCount: 1,
    disconnectedPlayers: [],
    tilesNumber: 100,
    doorsNumber: 5,
    timeStartOfGame: new Date('2023-04-15T10:30:00'),
    timeEndOfGame: new Date('2023-04-15T10:45:42'),
};

export const mockCTFStats: Stats = {
    playersStats: mockPlayerStats,
    disconnectedPlayersStats: mockDisconnectedPlayerStats,
    gameStats: mockGameStats,
};

export const mockStandardGameStats: GameStats = {
    ...mockGameStats,
    flagsCaptured: new Set(),
    flagsCapturedCount: 0,
};

export const mockStandardStats: Stats = {
    playersStats: mockPlayerStats.map((player) => ({
        ...player,
        flagsCapturedCount: undefined,
    })),
    disconnectedPlayersStats: mockDisconnectedPlayerStats,
    gameStats: mockStandardGameStats,
};
