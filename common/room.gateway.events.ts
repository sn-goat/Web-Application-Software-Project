export enum RoomEvents {
    Welcome = 'welcome',

    CreateRoom = 'createRoom',
    RoomCreated = 'roomCreated',

    JoinRoom = 'joinRoom',
    PlayerJoined = 'playerJoined',
    JoinError = 'joinError',

    ShareCharacter = 'shareCharacter',
    CreateVirtualPlayer = 'createVirtualPlayer',
    SetCharacter = 'setCharacter',

    LockRoom = 'lockRoom',
    RoomLocked = 'roomLocked',

    UnlockRoom = 'unlockRoom',
    RoomUnlocked = 'roomUnlocked',

    ExpelPlayer = 'expelPlayer',
    DisconnectPlayer = 'disconnectPlayer',
    PlayerRemoved = 'playerRemoved',
    PlayersUpdated = 'updatePlayers',
}
