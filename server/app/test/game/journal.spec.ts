/* eslint-disable @typescript-eslint/no-explicit-any */
import { IRoom } from '@common/game';
import { JournalEvent } from '@common/game.gateway.events';
import { FightJournal, FightMessage, GameMessage } from '@common/journal';
import { IPlayer, Team } from '@common/player';
import { Server } from 'socket.io';
import { JournalService } from '@app/services/journal/journal.service';

describe('JournalService', () => {
    let journalService: JournalService;
    let mockServer: Partial<Server>;
    let mockRoom: IRoom;
    let mockFightJournal: FightJournal;

    beforeEach(() => {
        journalService = new JournalService();

        // Mock the Socket.io server
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };

        // Mock players with all required IPlayer properties
        const player1: IPlayer = {
            id: 'player1',
            name: 'Player One',
            avatar: 'avatar1',
            attackPower: 5,
            defensePower: 3,
            speed: 2,
            life: 10,
            attackDice: 'D6',
            defenseDice: 'D4',
            team: Team.RED,
            actions: 1,
            wins: 0,
            movementPts: 2,
            position: { x: 0, y: 0 },
            spawnPosition: { x: 0, y: 0 },
            fleeAttempts: 2,
            currentLife: 10,
            diceResult: 5,
        };

        const player2: IPlayer = {
            id: 'player2',
            name: 'Player Two',
            avatar: 'avatar2',
            attackPower: 4,
            defensePower: 4,
            speed: 3,
            life: 8,
            attackDice: 'D4',
            defenseDice: 'D6',
            team: Team.BLUE,
            actions: 1,
            wins: 0,
            movementPts: 3,
            position: { x: 1, y: 1 },
            spawnPosition: { x: 1, y: 1 },
            fleeAttempts: 2,
            currentLife: 8,
            diceResult: 3,
        };

        // Mock room with all required IRoom properties
        mockRoom = {
            accessCode: 'room123',
            organizerId: 'organizer1',
            isLocked: false,
            game: {
                players: [player1, player2],
                map: [[]],
                currentTurn: 0,
                isDebugMode: false,
                maxPlayers: 2,
                isCTF: false,
            },
        };

        // Mock fight journal
        mockFightJournal = {
            accessCode: 'room123',
            attacker: player1,
            defender: player2,
            damage: 10,
            fleeSuccess: false,
        };
    });

    describe('initialization', () => {
        it('should create an instance of JournalService', () => {
            expect(journalService).toBeDefined();
            expect(journalService.journalMap).toBeDefined();
            expect(journalService.journalMap.size).toBe(0);
        });
    });

    describe('dispatchEntry', () => {
        it('should process game entry and emit to room for GameMessage.START_TURN', () => {
            const playerNames = ['Player One'];
            const result = journalService.dispatchEntry(mockRoom, playerNames, GameMessage.START_TURN, mockServer as Server);

            expect(result).toBeDefined();
            expect(result.messageType).toBe(GameMessage.START_TURN);
            expect(result.accessCode).toBe('room123');
            expect(result.playersInvolved).toContain('player1');
            expect(mockServer.to).toHaveBeenCalledWith('room123');
            expect(mockServer.emit).toHaveBeenCalledWith(JournalEvent.Add, result);
            expect(journalService.journalMap.has('room123')).toBeTruthy();
            expect(journalService.journalMap.get('room123').length).toBe(1);
        });

        it('should process game entry with two players', () => {
            const playerNames = ['Player One', 'Player Two'];
            const result = journalService.dispatchEntry(mockRoom, playerNames, GameMessage.START_FIGHT, mockServer as Server);

            expect(result).toBeDefined();
            expect(result.messageType).toBe(GameMessage.START_FIGHT);
            expect(result.message).toContain('Player One et Player Two');
            expect(journalService.journalMap.get('room123').length).toBe(1);
        });

        it('should process game entry for END_GAME message with one player', () => {
            const playerNames = ['Player One'];
            const result = journalService.dispatchEntry(mockRoom, playerNames, GameMessage.END_GAME, mockServer as Server);

            expect(result).toBeDefined();
            expect(result.messageType).toBe(GameMessage.END_GAME);
            expect(result.message).toContain('Les joueurs actifs sont');
            expect(journalService.journalMap.get('room123').length).toBe(1);
        });

        it('should process game entry for QUIT message', () => {
            const playerNames = ['Player One'];
            const result = journalService.dispatchEntry(mockRoom, playerNames, GameMessage.QUIT, mockServer as Server);

            expect(result).toBeDefined();
            expect(result.messageType).toBe(GameMessage.QUIT);
            expect(result.playersInvolved).toContain('');
            expect(journalService.journalMap.get('room123').length).toBe(1);
        });

        it('should return null if too many players involved in game message', () => {
            const playerNames = ['Player One', 'Player Two', 'Player Three'];
            const result = journalService.dispatchEntry(mockRoom, playerNames, GameMessage.START_TURN, mockServer as Server);

            expect(result).toBeNull();
            expect(journalService.journalMap.has('room123')).toBeFalsy();
        });

        it('should process fight entry for ATTACK message', () => {
            const playerNames = ['Player One', 'Player Two'];
            const result = journalService.dispatchEntry(mockFightJournal, playerNames, FightMessage.ATTACK, mockServer as Server);

            expect(result).toBeDefined();
            expect(result.messageType).toBe(FightMessage.ATTACK);
            expect(result.message).toContain('inflige 10 points');
            expect(mockServer.to).toHaveBeenCalledWith('player1');
            expect(mockServer.to).toHaveBeenCalledWith('player2');
            expect(mockServer.emit).toHaveBeenCalledTimes(2);
            expect(journalService.journalMap.get('room123').length).toBe(1);
        });

        it('should process fight entry for non-ATTACK fight message', () => {
            const playerNames = ['Player One'];
            const result = journalService.dispatchEntry(mockFightJournal, playerNames, FightMessage.FLEE_ATTEMPT, mockServer as Server);

            expect(result).toBeDefined();
            expect(result.messageType).toBe(FightMessage.FLEE_ATTEMPT);
            expect(result.message).toContain('Player One');
            expect(journalService.journalMap.get('room123').length).toBe(1);
        });

        it('should return null if players are undefined in fight entry', () => {
            const invalidFightJournal: FightJournal = {
                accessCode: 'room123',
                attacker: null,
                defender: null,
            };

            const playerNames = ['Player One'];
            const result = journalService.dispatchEntry(invalidFightJournal, playerNames, FightMessage.ATTACK, mockServer as Server);

            expect(result).toBeNull();
        });

        it('should return null if players are undefined in game entry', () => {
            const invalidRoom: IRoom = {
                accessCode: 'room123',
                organizerId: 'organizer1',
                isLocked: false,
                game: {
                    players: null,
                } as any,
            };

            const playerNames = ['Player One'];
            const result = journalService.dispatchEntry(invalidRoom, playerNames, GameMessage.START_TURN, mockServer as Server);

            expect(result).toBeNull();
        });

        it('should return null if currentPlayers is null', () => {
            const result = journalService.dispatchEntry(mockRoom, null, GameMessage.START_TURN, mockServer as Server);
            expect(result).toBeNull();
        });

        it('should correctly record entries in the journalMap for existing room', () => {
            // First entry
            journalService.dispatchEntry(mockRoom, ['Player One'], GameMessage.START_TURN, mockServer as Server);

            // Second entry for same room
            const result = journalService.dispatchEntry(mockRoom, ['Player One'], GameMessage.PICK_ITEM, mockServer as Server);

            expect(journalService.journalMap.get('room123').length).toBe(2);
            expect(journalService.journalMap.get('room123')[1]).toBe(result);
        });
    });
});
