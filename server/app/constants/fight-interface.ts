import { Player } from '@app/class/player';

export enum FightResultType {
    Tie = 'tie',
    Decisive = 'decisive',
}

export interface FightResult {
    type: FightResultType;
    winner?: Player;
    loser?: Player;
}
