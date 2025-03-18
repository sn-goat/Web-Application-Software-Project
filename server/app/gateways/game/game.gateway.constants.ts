export const THREE_SECONDS_IN_MS = 3000;
export const TURN_DURATION_IN_S = 30;
export const FIGHT_TURN_DURATION_IN_S = 5;
export const MOVEMENT_TIMEOUT_IN_MS = 150;
export const RANDOM_SORT_OFFSET = 0.5;

export enum TimerEvents {
    Update = 'timerUpdate',
    End = 'timerEnded',
    FightUpdate = 'fightUpdate',
    FightEnd = 'fightEnd',
}

export enum InternalEvents {
    PlayerRemoved = 'playerRemoved',
}
