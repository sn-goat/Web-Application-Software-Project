export enum GameEvents {
    Create = 'createGame',
    Configure = 'configureGame',
    Ready = 'readyForStart',
    Debug = 'toggleDebug',
    EndDebug = 'endDebug',
    AssignSpawn = 'assignSpawn',
    BroadcastStartGame = 'startGame',
    BroadcastDebugState = 'debug',
    BroadcastEndDebugState = 'endDebug',
    End = 'endGame',
    BroadcastEndGame = 'endGame',
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
    BroadcastMove = 'playerMove',
    BroadcastItem = 'eventItem',
    BroadcastDoor = 'eventOnDoor',
    UpdateActions = 'updateActions',
}

export enum FightEvents {
    Init = 'initFightAck',
    SwitchTurn = 'switchTurn',
    End = 'endFight',
    Winner = 'winner',
    Loser = 'loser',
    Flee = 'fleeAck',
    FailedFlee = 'failedFlee',
    Attack = 'attackAck',
    UpdateTimer = 'fightTimeUpdate',
}
