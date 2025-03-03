import { GameService, Player } from '@app/gateways/game.service';

describe('GameService', () => {
    let service: GameService;

    beforeEach(() => {
        service = new GameService();
    });

    describe('createGame', () => {
        it('should create a game room with correct properties', () => {
            const organizerId = 'organizer1';
            const room = service.createGame(organizerId);

            expect(room).toHaveProperty('accessCode');
            expect(room.organizerId).toEqual(organizerId);
            expect(room.players).toEqual([]);
            expect(room.isLocked).toBe(false);
        });

        it('should generate unique access codes', () => {
            const room1 = service.createGame('org1');
            const room2 = service.createGame('org2');
            expect(room1.accessCode).not.toEqual(room2.accessCode);
        });
    });

    describe('joinGame', () => {
        it('should allow a player to join an existing unlocked room', () => {
            const organizerId = 'organizer1';
            const room = service.createGame(organizerId);
            const player: Player = { id: 'player1', name: 'Alice', avatar: 'avatar1' };

            const updatedRoom = service.joinGame(room.accessCode, player);
            expect(updatedRoom).not.toBeNull();
            expect(updatedRoom?.players.length).toBe(1);
            expect(updatedRoom?.players[0]).toEqual(player);
        });

        it('should return null when trying to join a non-existent room', () => {
            const player: Player = { id: 'player1', name: 'Alice', avatar: 'avatar1' };
            const room = service.joinGame('nonexistent', player);
            expect(room).toBeNull();
        });

        it('should return null when trying to join a locked room', () => {
            const organizerId = 'organizer1';
            const room = service.createGame(organizerId);
            service.lockRoom(room.accessCode);

            const player: Player = { id: 'player1', name: 'Alice', avatar: 'avatar1' };
            const result = service.joinGame(room.accessCode, player);
            expect(result).toBeNull();
        });

        it('should append "-2" to duplicate player names', () => {
            const organizerId = 'organizer1';
            const room = service.createGame(organizerId);

            const player1: Player = { id: 'player1', name: 'Alice', avatar: 'avatar1' };
            service.joinGame(room.accessCode, player1);

            const player2: Player = { id: 'player2', name: 'Alice', avatar: 'avatar2' };
            const updatedRoom = service.joinGame(room.accessCode, player2);

            expect(updatedRoom?.players.length).toBe(2);
            expect(updatedRoom?.players[1].name).toEqual('Alice-2');
        });
    });

    describe('removePlayer', () => {
        it('should remove an existing player from the room', () => {
            const room = service.createGame('org1');
            const player: Player = { id: 'player1', name: 'Alice', avatar: 'avatar1' };
            service.joinGame(room.accessCode, player);

            const updatedRoom = service.removePlayer(room.accessCode, player.id);
            expect(updatedRoom?.players.length).toBe(0);
        });

        it('should return null if the room does not exist', () => {
            const result = service.removePlayer('nonexistent', 'player1');
            expect(result).toBeNull();
        });

        it('should return null if the player is not found in the room', () => {
            const room = service.createGame('org1');
            const result = service.removePlayer(room.accessCode, 'nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('lockRoom', () => {
        it('should lock an existing room', () => {
            const room = service.createGame('org1');
            const updatedRoom = service.lockRoom(room.accessCode);
            expect(updatedRoom).not.toBeNull();
            expect(updatedRoom?.isLocked).toBe(true);
        });

        it('should return null if the room does not exist', () => {
            const result = service.lockRoom('nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('unlockRoom', () => {
        it('should unlock a locked room', () => {
            const room = service.createGame('org1');
            service.lockRoom(room.accessCode);
            const updatedRoom = service.unlockRoom(room.accessCode);
            expect(updatedRoom).not.toBeNull();
            expect(updatedRoom?.isLocked).toBe(false);
        });

        it('should return null if the room does not exist', () => {
            const result = service.unlockRoom('nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('startGame', () => {
        it('should start a game if the room exists and is locked', () => {
            const room = service.createGame('org1');
            service.lockRoom(room.accessCode);
            const startedRoom = service.startGame(room.accessCode);
            expect(startedRoom).not.toBeNull();
        });

        it('should return null if the room does not exist', () => {
            const result = service.startGame('nonexistent');
            expect(result).toBeNull();
        });

        it('should return null if the room is not locked', () => {
            const room = service.createGame('org1');
            const result = service.startGame(room.accessCode);
            expect(result).toBeNull();
        });
    });

    describe('submitMove', () => {
        it('should submit a move if the room exists', () => {
            const room = service.createGame('org1');
            const player: Player = { id: 'player1', name: 'Alice', avatar: 'avatar1' };
            service.joinGame(room.accessCode, player);
            const result = service.submitMove(room.accessCode, player.id, 'move1');
            expect(result).not.toBeNull();
        });

        it('should return null if the room does not exist', () => {
            const result = service.submitMove('nonexistent', 'player1', 'move1');
            expect(result).toBeNull();
        });
    });
});
