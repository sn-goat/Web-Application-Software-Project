export enum GameEvents {
    Create = 'createGame', // Client envoi la map
    Configure = 'configureGame', // Client qui envoi l'état du jeu
    Ready = 'readyForStart', // Client
    Debug = 'debugGame', // Client
    BroadcastStartGame = 'startGame', // Serveur
    BroadcastDebugState = 'debugState', // Serveur
}

export enum TurnEvents {
    Start = 'startTurn', // Serveur
    UpdateTimer = 'timeUpdate', // Server
    End = 'endTurn', // Serveur (timer / plus déplacement et action inutile / plus de déplacement et plus d'action )
    BroadcastEnd = 'endPlayerTurn', // Serveur
    PlayerTurn = 'nextPlayerTurn', // Serveur
    FullInventory = 'fullInventoryAck', // Serveur (pop généré, et attend choix user ne met pas en pause le Timer)
    Move = 'moveAck', // Client (return New Path)
    ChangeDoorState = 'changeDoorState', // Client
    BroadcastMove = 'playerMove', // Serveur (pos_debut, pos_fin) x nombre de mouvements
    BroadcastItem = 'eventItem', // Serveur (type, pos, Item?)
    BroadcastDoor = 'eventOnDoor', // Serveur (type, pos)
}

export enum FightEvents {
    Init = 'initFightAck', // Client
    SwitchTurn = 'switchTurn', // Serveur (id du joueur dont c'est le tour & met fin à celui de l'autre)
    End = 'endFight', // Server (fuite réussite/mort ennemie)
    Flee = 'fleeAck', // Client
    Attack = 'attackAck', // Client
}
