import { Vec2 } from './board';

export interface PlayerInfo {
    id: string;
    name: string;
    avatar: string;
}

export type Dice = 'D4' | 'D6';

export interface PlayerAttributes {
    attack: number;
    defense: number;
    speed: number;
    life: number;
    attackDice: Dice;
    defenseDice: Dice;
}

export interface GameStats {
    actions: number;
    wins: number;
    movementPts: number;
    position: Vec2;
    spawnPosition: Vec2;
}

export type PlayerStats = PlayerInfo & PlayerAttributes & GameStats;

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
