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
export const DEFAULT_DEFENSE_VALUE = 4;
