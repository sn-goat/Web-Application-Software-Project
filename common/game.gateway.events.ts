export enum GameEvents {
    Start = 'startGame',
    GameStarted = 'gameStarted',
    Ready = 'readyForStart',

    Debug = 'toggleDebug',
    DebugStateChanged = 'debugStateChanged',

    GameEnded = 'gameEnded',

    Error = 'error',
}

export enum TurnEvents {
    PlayerTurn = 'nextPlayerTurn',
    Start = 'startTurn',
    UpdateTurn = 'updateTurn',
    End = 'endTurn',

    UpdateTimer = 'timeUpdate',

    Move = 'moveAck',
    DebugMove = 'debugMove',
    PlayerMoved = 'playerMoved',

    ChangeDoorState = 'changeDoorState',
    DoorStateChanged = 'eventOnDoor',

    BroadcastItem = 'eventItem',
    DroppedItem = 'droppedItem',
    InventoryFull = 'inventoryFull',
    InventoryChoice = 'inventoryChoice',
    MapUpdate = 'mapUpdate',
}

export enum FightEvents {
    Init = 'initFightAck',
    ChangeFighter = 'changeFighter',

    UpdateTimer = 'fightTimeUpdate',

    Flee = 'fleeAck',
    Attack = 'attackAck',

    End = 'endFight',
    Winner = 'winner',
    Loser = 'loser',
}

export enum JournalEvent {
    Add = 'addJournalEntry',
    Clear = 'clearJournal',
}
