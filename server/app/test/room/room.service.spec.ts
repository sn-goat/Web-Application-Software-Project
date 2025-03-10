/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { RoomService } from '@app/services/room.service';
import { getLobbyLimit } from '@common/lobby-limits';
import { PlayerStats } from '@common/player';

// Mock the getLobbyLimit dependency so we can control its return value in tests.
jest.mock('@common/lobby-limits', () => ({
    getLobbyLimit: jest.fn(() => 10),
}));

describe('RoomService', () => {
    let service: RoomService;

    beforeEach(() => {
        service = new RoomService();
        jest.clearAllMocks();
    });

    describe('createGame', () => {
        it('should create a game room with proper attributes', () => {
            const organizerId = 'org1';
            const size = 10;
            const room = service.createRoom(organizerId, size);

            expect(room.accessCode).toBeDefined();
            expect(room.organizerId).toBe(organizerId);
            expect(room.players).toEqual([]);
            expect(room.isLocked).toBe(false);
            expect(room.mapSize).toBe(size);
        });
    });

    describe('joinGame', () => {
        it('should allow joining a valid unlocked room', () => {
            const organizerId = 'org1';
            const size = 10;
            const room = service.createRoom(organizerId, size);

            const joined = service.joinRoom(room.accessCode);
            expect(joined).toEqual(room);
        });

        it('should return null when joining a non-existent room', () => {
            const joined = service.joinRoom('nonexistent');
            expect(joined).toBeNull();
        });

        it('should return null when joining a locked room', () => {
            const organizerId = 'org1';
            const size = 10;
            const room = service.createRoom(organizerId, size);
            room.isLocked = true; // Manually lock the room

            const joined = service.joinRoom(room.accessCode);
            expect(joined).toBeNull();
        });
    });

    // test for getRoom
    describe('getRoom', () => {
        it('should return a room when it exists', () => {
            const organizerId = 'org1';
            const size = 10;
            const room = service.createRoom(organizerId, size);

            const found = service.getRoom(room.accessCode);
            expect(found).toEqual(room);
        });

        it('should return null when room does not exist', () => {
            const found = service.getRoom('nonexistent');
            expect(found).toBeNull();
        });
    });

    describe('removePlayer', () => {
        it('should remove a player from a room', () => {
            const organizerId = 'org1';
            const size = 10;
            const room = service.createRoom(organizerId, size);
            const player: PlayerStats = {
                id: 'player1',
                name: 'Alice',
                avatar: 'default.png',
                life: 4,
                attack: 4,
                defense: 4,
                speed: 4,
                attackDice: 'D6',
                defenseDice: 'D4',
                movementPts: 4,
                actions: 4,
                wins: 0,
                position: { x: 0, y: 0 },
                spawnPosition: { x: 0, y: 0 },
            };

            // Add a player via shareCharacter (which also uses getLobbyLimit)
            service.shareCharacter(room.accessCode, player);
            const updatedRoom = service.removePlayer(room.accessCode, player.id);
            expect(updatedRoom?.players).not.toContainEqual(player);
        });

        it('should return null if player not found in room', () => {
            const organizerId = 'org1';
            const size = 10;
            const room = service.createRoom(organizerId, size);

            const result = service.removePlayer(room.accessCode, 'nonexistent');
            expect(result).toBeNull();
        });

        it('should return null if room does not exist for player removal', () => {
            const result = service.removePlayer('nonexistent', 'player1');
            expect(result).toBeNull();
        });
    });

    describe('disconnectPlayer', () => {
        it('should disconnect the organizer by removing all players and deleting the room', () => {
            const organizerId = 'org1';
            const size = 10;
            const room = service.createRoom(organizerId, size);
            const player1: PlayerStats = {
                id: 'player1',
                name: 'Alice',
                avatar: 'default.png',
                life: 4,
                attack: 4,
                defense: 4,
                speed: 4,
                attackDice: 'D6',
                defenseDice: 'D4',
                movementPts: 4,
                actions: 4,
                wins: 0,
                position: { x: 0, y: 0 },
                spawnPosition: { x: 0, y: 0 },
            };
            const player2: PlayerStats = {
                id: 'player1',
                name: 'Alice',
                avatar: 'default.png',
                life: 4,
                attack: 4,
                defense: 4,
                speed: 4,
                attackDice: 'D6',
                defenseDice: 'D4',
                movementPts: 4,
                actions: 4,
                wins: 0,
                position: { x: 0, y: 0 },
                spawnPosition: { x: 0, y: 0 },
            };

            service.shareCharacter(room.accessCode, player1);
            service.shareCharacter(room.accessCode, player2);

            // Disconnect organizer: this should remove all players and delete the room.
            service.disconnectPlayer(room.accessCode, organizerId);

            const joined = service.joinRoom(room.accessCode);
            expect(joined).toBeNull();
        });

        it('should disconnect a non-organizer player without deleting the room', () => {
            const organizerId = 'org1';
            const size = 10;
            const room = service.createRoom(organizerId, size);
            const player: PlayerStats = {
                id: 'player1',
                name: 'Alice',
                avatar: 'default.png',
                life: 4,
                attack: 4,
                defense: 4,
                speed: 4,
                attackDice: 'D6',
                defenseDice: 'D4',
                movementPts: 4,
                actions: 4,
                wins: 0,
                position: { x: 0, y: 0 },
                spawnPosition: { x: 0, y: 0 },
            };

            service.shareCharacter(room.accessCode, player);

            const updatedRoom = service.disconnectPlayer(room.accessCode, player.id);
            expect(updatedRoom).not.toBeNull();
            expect(updatedRoom?.players).not.toContainEqual(player);
        });
    });

    describe('lockRoom and unlockRoom', () => {
        it('should lock a room', () => {
            const organizerId = 'org1';
            const size = 10;
            const room = service.createRoom(organizerId, size);

            const lockedRoom = service.lockRoom(room.accessCode);
            expect(lockedRoom?.isLocked).toBe(true);
        });

        it('should unlock a room', () => {
            const organizerId = 'org1';
            const size = 10;
            const room = service.createRoom(organizerId, size);
            room.isLocked = true;

            const unlockedRoom = service.unlockRoom(room.accessCode);
            expect(unlockedRoom?.isLocked).toBe(false);
        });
    });

    describe('shareCharacter', () => {
        it('should add a character to the room and rename duplicate names', () => {
            const organizerId = 'org1';
            const size = 10;
            const room = service.createRoom(organizerId, size);
            const player1: PlayerStats = {
                id: 'player1',
                name: 'Alice',
                avatar: 'default.png',
                life: 4,
                attack: 4,
                defense: 4,
                speed: 4,
                attackDice: 'D6',
                defenseDice: 'D4',
                movementPts: 4,
                actions: 4,
                wins: 0,
                position: { x: 0, y: 0 },
                spawnPosition: { x: 0, y: 0 },
            };
            const player2: PlayerStats = {
                id: 'player1',
                name: 'Alice',
                avatar: 'default.png',
                life: 4,
                attack: 4,
                defense: 4,
                speed: 4,
                attackDice: 'D6',
                defenseDice: 'D4',
                movementPts: 4,
                actions: 4,
                wins: 0,
                position: { x: 0, y: 0 },
                spawnPosition: { x: 0, y: 0 },
            };

            service.shareCharacter(room.accessCode, player1);
            const updatedRoom = service.shareCharacter(room.accessCode, player2);

            expect(updatedRoom?.players.length).toBe(2);
            expect(updatedRoom?.players[1].name).toMatch(/Alice-\d+/);
        });

        it('should lock the room when max players are reached', () => {
            const organizerId = 'org1';
            const size = 10;
            const room = service.createRoom(organizerId, size);

            // For this test, set the lobby limit to 2.
            (getLobbyLimit as jest.Mock).mockReturnValue(2);

            const player1: PlayerStats = {
                id: 'player1',
                name: 'Alice',
                avatar: 'default.png',
                life: 4,
                attack: 4,
                defense: 4,
                speed: 4,
                attackDice: 'D6',
                defenseDice: 'D4',
                movementPts: 4,
                actions: 4,
                wins: 0,
                position: { x: 0, y: 0 },
                spawnPosition: { x: 0, y: 0 },
            };
            const player2: PlayerStats = {
                id: 'player1',
                name: 'Bob',
                avatar: 'default.png',
                life: 4,
                attack: 4,
                defense: 4,
                speed: 4,
                attackDice: 'D6',
                defenseDice: 'D4',
                movementPts: 4,
                actions: 4,
                wins: 0,
                position: { x: 0, y: 0 },
                spawnPosition: { x: 0, y: 0 },
            };
            service.shareCharacter(room.accessCode, player1);
            const updatedRoom = service.shareCharacter(room.accessCode, player2);

            expect(updatedRoom?.isLocked).toBe(true);
        });
    });

    describe('deleteRoom', () => {
        it('should delete a room successfully', () => {
            const organizerId = 'org1';
            const size = 10;
            const room = service.createRoom(organizerId, size);

            service.deleteRoom(room.accessCode);
            const joined = service.joinRoom(room.accessCode);
            expect(joined).toBeNull();
        });

        it('should log an error when deleting a non-existent room', () => {
            // Spy on the logger's error method.
            const loggerSpy = jest.spyOn((service as any).logger, 'error');

            service.deleteRoom('nonexistent');

            expect(loggerSpy).toHaveBeenCalledWith('Room with access code nonexistent not found for deletion.');
        });
    });
});

describe('RoomService - non-existent room handling', () => {
    let service: RoomService;
    let loggerErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        service = new RoomService();
        // Remplacer le logger par un spy en utilisant jest.spyOn
        loggerErrorSpy = jest.spyOn((service as any).logger, 'error');
    });

    it('lockRoom should return null and log error when room is not found for locking', () => {
        const accessCode = 'nonExistingLock';
        const result = service.lockRoom(accessCode);
        expect(result).toBeNull();
        expect(loggerErrorSpy).toHaveBeenCalledWith(`Room with access code ${accessCode} not found for locking.`);
    });

    it('unlockRoom should return null and log error when room is not found for unlocking', () => {
        const accessCode = 'nonExistingUnlock';
        const result = service.unlockRoom(accessCode);
        expect(result).toBeNull();
        expect(loggerErrorSpy).toHaveBeenCalledWith(`Room with access code ${accessCode} not found for unlocking.`);
    });

    it('shareCharacter should return null and log error when room is not found for unlocking', () => {
        const accessCode = 'nonExistingShare';
        const player: PlayerStats = {
            id: 'player1',
            name: 'Alice',
            avatar: 'default.png',
            life: 4,
            attack: 4,
            defense: 4,
            speed: 4,
            attackDice: 'D6',
            defenseDice: 'D4',
            movementPts: 4,
            actions: 4,
            wins: 0,
            position: { x: 0, y: 0 },
            spawnPosition: { x: 0, y: 0 },
        };
        const result = service.shareCharacter(accessCode, player);
        expect(result).toBeNull();
        expect(loggerErrorSpy).toHaveBeenCalledWith(`Room with access code ${accessCode} not found.`);
    });

    it('disconnectPlayer should return null and log error when room is not found for player disconnection', () => {
        const accessCode = 'nonExistingDisconnect';
        const result = service.disconnectPlayer(accessCode, 'player1');
        expect(result).toBeNull();
        expect(loggerErrorSpy).toHaveBeenCalledWith(`Room with access code ${accessCode} not found for player disconnection.`);
    });
});
