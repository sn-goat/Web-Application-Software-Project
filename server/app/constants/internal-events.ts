export enum InternalTimerEvents {
    FightUpdate = 'fightTimerUpdate',
    TurnUpdate = 'turnTimerUpdate',
    End = 'timerEnded',
}

export enum InternalRoomEvents {
    CloseRoom = 'closeRoom',
    PlayerRemoved = 'playerRemoved',
    PlayersUpdated = 'updatePlayers',
}

export enum InternalGameEvents {
    DebugStateChanged = 'debugStateChanged',
    Winner = 'Winner',
}

export enum InternalTurnEvents {
    Move = 'playerMove',
    Update = 'updateTurn',
    Start = 'startTurn',
    ChangeTurn = 'ChangeTurn',
    ItemCollected = 'itemCollected',
    InventoryFull = 'inventoryFull',
    DroppedItem = 'droppedItem',
}

export enum InternalEvents {
    UpdateTimer = 'updateTimer',
    EndTimer = 'endTimer',
    PlayerMoved = 'playerMoved',
    PlayerRemoved = 'playerRemoved',
}

export enum InternalFightEvents {
    Init = 'initFight',
    ChangeFighter = 'changeFighter',
    End = 'endFight',
    Attack = 'attack',
    Flee = 'flee',
}
