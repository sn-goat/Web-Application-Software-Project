import { Vec2 } from './board';
import { Item } from './enums';

export interface PlayerInput {
    name: string,
    avatar: string,
    life: number,
    speed: number,
    attackPower: number,
    defensePower: number,
    attackDice: Dice,
    defenseDice: Dice,
}
export interface PlayerInfo {
    id: string;
    name: string;
    avatar: string;
}

export type Dice = 'D4' | 'D6';

export interface PlayerAttributes {
    attackPower: number;
    defensePower: number;
    speed: number;
    life: number;
    attackDice: Dice;
    defenseDice: Dice;
    team?: Team;
}

export enum Team {
    RED = 'Rouge',
    BLUE = 'Bleu',
}

export interface GameStats {
    actions: number;
    wins: number;
    movementPts: number;
    position: Vec2;
    spawnPosition: Vec2;
}

export interface PlayerStats {
    name: string;
    takenDamage: number;
    givenDamage: number;
    itemsPicked?: Set<Item>;
    itemsPickedCount?: number;
    tilesVisited?: Set<Vec2>;
    tilesVisitedPercentage?: string;
    wins: number;
    losses: number;
    fleeSuccess: number; 
    totalFights?: number;
}

export interface FightInfo {
    fleeAttempts: number;
    currentLife: number;
    diceResult: number;
}

export type IPlayer = PlayerInfo & PlayerAttributes & GameStats & FightInfo & PlayerStats;

export const DEFAULT_ATTACK_VALUE = 4;
export const ATTACK_ICE_DECREMENT = 2;
export const DEFENSE_ICE_DECREMENT = 2;
export const DEFAULT_DEFENSE_VALUE = 4;
export const DEFAULT_SPEED_VALUE = 4;
export const DEFAULT_LIFE_VALUE = 4;
export const DEFAULT_DICE: Dice = 'D4';
export const DEFAULT_MOVEMENT_POINTS = 0;
export const DEFAULT_ACTIONS = 1;
export const DEFAULT_WINS = 0;
export const DEFAULT_FLEE_ATTEMPTS = 2;
export const DEFAULT_POSITION: Vec2 = { x: 0, y: 0 };
export const DEFAULT_POSITION_BEFORE_GAME: Vec2 = { x: -1, y: -1 };
export const DEFAULT_MOVEMENT_DIRECTIONS: Vec2[] = [
    { x: 0, y: 1 }, // Down
    { x: 1, y: 0 }, // Right
    { x: 0, y: -1 }, // Up
    { x: -1, y: 0 }, // Left
];
export const DIAGONAL_MOVEMENT_DIRECTIONS: Vec2[] = [
    { x: 0, y: 1 }, // Vertical movement
    { x: 0, y: -1 },
    { x: 1, y: 0 }, // Horizontal movement
    { x: -1, y: 0 },
    { x: 1, y: 1 }, // Diagonal movement
    { x: -1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
];
