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
}

export type PlayerStats = PlayerInfo & PlayerAttributes & GameStats;
