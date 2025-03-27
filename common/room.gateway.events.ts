export enum RoomEvents {
    Welcome = 'welcome',

    CreateRoom = 'createRoom',
    RoomCreated = 'roomCreated',
    
    JoinRoom = 'joinRoom',
    PlayerJoined = 'playerJoined',
    JoinError = 'joinError',
    
    ShareCharacter = 'shareCharacter',
    SetCharacter = 'setCharacter',
    
    LockRoom = 'lockRoom',
    RoomLocked = 'roomLocked',

    UnlockRoom = 'unlockRoom',
    RoomUnlocked = 'roomUnlocked',
    
    ExpelPlayer = 'expelPlayer',
    DisconnectPlayer = 'disconnectPlayer',
    PlayerRemoved = 'playerRemoved',
    PlayersUpdated = 'updatePlayers',

    // RemovePlayer = 'removePlayer',
    // PlayerList = 'playersList',
    // GetRoom = 'getRoom',
    // LockError = 'lockError',
    // UnlockError = 'unlockError',
    // CharacterError = 'characterError',
    // RemoveError = 'removeError',
    // DisconnectError = 'disconnectError',
    // RoomError = 'roomError',
    // RoomData = 'roomData',
    // PlayerDisconnected = 'playerDisconnected',
    // QuitGame = 'quitRoomGame',
    // AdminDisconnected = 'adminDisconnected',
    // NotEnoughPlayer = 'NotEnoughPlayer',
}
