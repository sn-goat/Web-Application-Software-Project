import { Vec2 } from './board';
import { Item } from './enums';

export interface PlayerInput {
    name: string;
    avatar: string;
    life: number;
    speed: number;
    attackPower: number;
    defensePower: number;
    attackDice: Dice;
    defenseDice: Dice;
}
export interface PlayerInfo {
    id: string;
    name: string;
    avatar: string;
    virtualStyle?: string;
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
    Red = 'Rouge',
    Blue = 'Bleu',
}

export enum VirtualPlayerStyles {
    Aggressive = 'Agressif',
    Defensive = 'Defensif',
}

export interface GameStats {
    actions: number;
    wins: number;
    movementPts: number;
    position: Vec2;
    spawnPosition: Vec2;
    inventory: Item[];
}

export interface PlayerStats {
    name: string;
    takenDamage?: number;
    givenDamage?: number;
    itemsPicked?: Map<string,Item>;
    itemsPickedCount?: number;
    tilesVisited?: Map<string,Vec2>;
    tilesVisitedPercentage?: string;
    wins: number;
    losses?: number;
    fleeSuccess?: number;
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
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: -1, y: 0 },
];
export const DIAGONAL_POSITIONS: Vec2[] = [
    { x: 1, y: 1 },
    { x: -1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
];

export const VIRTUAL_PLAYER_NAMES: string[] = [
    'Aldoril',
    'Eldrin',
    'Thalion',
    'Faranor',
    'Galadren',
    'Lorian',
    'Cerethan',
    'Veloria',
    'Aerion',
    'Evangor',
    'Mythril',
    'Silvyr',
];
export const DIAGONAL_MOVEMENT_DIRECTIONS: Vec2[] = DEFAULT_MOVEMENT_DIRECTIONS.concat(DIAGONAL_POSITIONS);
