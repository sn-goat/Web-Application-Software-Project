export enum GameEvents {
    Start = 'startGame',
    GameStarted = 'gameStarted',
    Ready = 'readyForStart',

    Debug = 'toggleDebug',
    DebugStateChanged = 'debugStateChanged',
    
    GameEnded = 'gameEnded',

    Error = 'error',
    
    // Create = 'createGame',
    // Configure = 'configureGame',
    // EndDebug = 'endDebug',
    // AssignSpawn = 'assignSpawn',
    // BroadcastEndDebugState = 'endDebug',
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
    
    // BroadcastEnd = 'endPlayerTurn',
    // BroadcastItem = 'eventItem',
    // UpdateActions = 'updateActions',
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
    
    // FailedFlee = 'failedFlee',
}
