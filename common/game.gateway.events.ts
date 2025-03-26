export enum GameEvents {
    Start = 'startGame',
    Create = 'createGame',
    Configure = 'configureGame',
    Ready = 'readyForStart',
    Debug = 'toggleDebug',
    EndDebug = 'endDebug',
    AssignSpawn = 'assignSpawn',
    GameStarted = 'gameStarted',
    DebugStateChanged = 'debugStateChanged',
    BroadcastEndDebugState = 'endDebug',
    End = 'endGame',
    GameEnded = 'gameEnded',
    BroadcastQuitGame = 'playerQuit',
}

export enum TurnEvents {
    Start = 'startTurn',
    UpdateTimer = 'timeUpdate',
    UpdateTurn = 'updateTurn',
    End = 'endTurn',
    BroadcastEnd = 'endPlayerTurn',
    PlayerTurn = 'nextPlayerTurn',
    Move = 'moveAck',
    DebugMove = 'debugMove',
    ChangeDoorState = 'changeDoorState',
    PlayerMoved = 'playerMoved',
    BroadcastItem = 'eventItem',
    DoorStateChanged = 'eventOnDoor',
    UpdateActions = 'updateActions',
}

export enum FightEvents {
    Init = 'initFightAck',
    ChangeFighter = 'changeFighter',
    End = 'endFight',
    Winner = 'winner',
    Loser = 'loser',
    Flee = 'fleeAck',
    FailedFlee = 'failedFlee',
    Attack = 'attackAck',
    UpdateTimer = 'fightTimeUpdate',
}
