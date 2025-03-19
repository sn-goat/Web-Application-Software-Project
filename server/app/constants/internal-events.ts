export enum InternalTimerEvents {
    Update = 'timerUpdate',
    End = 'timerEnded',
}

export enum InternalGameEvents {
    AssignSpawn = 'assignSpawn',
}

export enum InternalTurnEvents {
    Move = 'playerMove',
    BroadcastDoor = 'doorBroadcast',
    Update = 'updateTurn',
    End = 'endTurn',
}

export enum InternalEvents {
    PlayerRemoved = 'playerRemoved',
}

export enum InternalFightEvents {
    Init = 'initFight',
    SwitchTurn = 'switchTurn',
    End = 'endFight',
}
