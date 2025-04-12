/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Fight } from '@app/class/fight';
import { Game } from '@app/class/game';
import { Player } from '@app/class/player';
import { Room } from '@app/class/room';
import { Timer } from '@app/class/timer';
import { InternalFightEvents, InternalGameEvents, InternalRoomEvents, InternalTimerEvents, InternalTurnEvents } from '@app/constants/internal-events';
import { Board } from '@app/model/database/board';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';
import { Avatar, PathInfo } from '@common/game';
import { EventEmitter2 } from 'eventemitter2';

const createDummyCell = (pos: Vec2, tile: Tile, player: Avatar = Avatar.Default, item: Item = Item.Default, cost: number = 1): Cell => ({
    position: pos,
    tile,
    item,
    cost,
    player,
});

const dummyBoard: Board = {
    name: 'TestBoard',
    description: 'Dummy board',
    size: 2,
    isCTF: false,
    visibility: Visibility.Public, // adjust according to your Visibility type
    board: [
        [createDummyCell({ x: 0, y: 0 }, Tile.Floor), createDummyCell({ x: 1, y: 0 }, Tile.ClosedDoor)],
        [createDummyCell({ x: 0, y: 1 }, Tile.Ice), createDummyCell({ x: 1, y: 1 }, Tile.Water)],
    ],
    updatedAt: new Date(), // Added to satisfy required property
    createdAt: new Date(),
};

interface FakeGame extends Partial<Game> {
    players: Player[];
    timer: Timer;
    hasStarted: boolean;
    isDebugMode: boolean;
    addPlayer: jest.Mock<any, any>;
    isGameFull: jest.Mock<any, any>;
    removePlayer: jest.Mock<any, any>;
    removePlayerOnMap: jest.Mock<any, any>;
    closeGame: jest.Mock<any, any>;
    isPlayerInFight: jest.Mock<any, any>;
    removePlayerFromFight: jest.Mock<any, any>;
    isPlayerTurn: jest.Mock<any, any>;
    endTurn: jest.Mock<any, any>;
    dropItems: jest.Mock<any, any>;
}

const createFakeGame = (): FakeGame => {
    return {
        players: [],
        timer: { stopTimer: jest.fn() as any } as Timer,
        hasStarted: false,
        isDebugMode: false,
        addPlayer: jest.fn((player: Player) => {
            fakeGame.players.push(player);
        }),
        isGameFull: jest.fn(() => false),
        removePlayer: jest.fn(),
        removePlayerOnMap: jest.fn(),
        closeGame: jest.fn(),
        isPlayerInFight: jest.fn(() => false),
        removePlayerFromFight: jest.fn(),
        isPlayerTurn: jest.fn(() => false),
        endTurn: jest.fn(),
        dropItems: jest.fn(), // ajoutez cette méthode pour corriger l'erreur
    } as FakeGame;
};

let fakeGame: FakeGame;
let globalEmitter: EventEmitter2;
let room: Room;
let internalEmitterSpy: jest.SpyInstance;

// --- Dummy Players ---
const createPlayer = (id: string, name: string): Player =>
    ({
        id,
        name,
        // Adding minimal properties needed by Room; additional properties are not used in Room
        inventory: [],
    }) as Player;

let player1: Player;
let player2: Player;

beforeEach(() => {
    // Create fresh global and internal emitters
    globalEmitter = new EventEmitter2();
    // We pass a fresh global emitter to the Room constructor.
    room = new Room(globalEmitter, '1234', 'adminId', dummyBoard);

    // Override the game instance with our fakeGame
    fakeGame = createFakeGame();
    room.game = fakeGame as unknown as Game;

    // Initialize dummy players
    player1 = createPlayer('p1', 'Alice');
    player2 = createPlayer('p2', 'Bob');

    // Clear fakeGame players array
    fakeGame.players = [];

    // Spy on internal emitter’s removeAllListeners so we can check in closeRoom
    internalEmitterSpy = jest.spyOn((room as any).internalEmitter, 'removeAllListeners');

    // Spy on global emitter's emit
    jest.spyOn(globalEmitter, 'emit');
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('Room', () => {
    describe('Constructor and event forwarding', () => {
        it('should forward InternalRoomEvents.PlayerRemoved events', () => {
            // Get the internal emitter from room
            const internalEmitter = (room as any).internalEmitter as EventEmitter2;
            // Fire a PlayerRemoved event on internal emitter{ name: string; playerId: string; message: string }
            internalEmitter.emit(InternalRoomEvents.PlayerRemoved, { name: 'joe', playerId: 'p1', message: 'Test message' });
            expect(globalEmitter.emit).toHaveBeenCalledWith(InternalRoomEvents.PlayerRemoved, {
                accessCode: room.accessCode,
                name: 'joe',
                playerId: 'p1',
                message: 'Test message',
            });
        });

        it('should forward InternalTimerEvents.TurnUpdate events', () => {
            const internalEmitter = (room as any).internalEmitter as EventEmitter2;
            internalEmitter.emit(InternalTimerEvents.TurnUpdate, 42);
            expect(globalEmitter.emit).toHaveBeenCalledWith(InternalTimerEvents.TurnUpdate, {
                accessCode: room.accessCode,
                remainingTime: 42,
            });
        });

        it('should forward InternalTimerEvents.FightUpdate events', () => {
            const internalEmitter = (room as any).internalEmitter as EventEmitter2;
            internalEmitter.emit(InternalTimerEvents.FightUpdate, 30);
            expect(globalEmitter.emit).toHaveBeenCalledWith(InternalTimerEvents.FightUpdate, {
                accessCode: room.accessCode,
                remainingTime: 30,
            });
        });

        it('should forward InternalTurnEvents.Move events', () => {
            const internalEmitter = (room as any).internalEmitter as EventEmitter2;
            const dummyVec: Vec2 = { x: 0, y: 0 };
            internalEmitter.emit(InternalTurnEvents.Move, { previousPosition: dummyVec, player: player1 });
            expect(globalEmitter.emit).toHaveBeenCalledWith(InternalTurnEvents.Move, {
                accessCode: room.accessCode,
                previousPosition: dummyVec,
                player: player1,
            });
        });

        it('should forward InternalTurnEvents.Update events', () => {
            const internalEmitter = (room as any).internalEmitter as EventEmitter2;
            const dummyPath: Record<string, PathInfo> = { key: { path: [{ x: 0, y: 0 }], cost: 1 } };
            internalEmitter.emit(InternalTurnEvents.Update, { player: player1, path: dummyPath });
            expect(globalEmitter.emit).toHaveBeenCalledWith(InternalTurnEvents.Update, { player: player1, path: dummyPath });
        });

        it('should forward InternalTurnEvents.ChangeTurn events', () => {
            const internalEmitter = (room as any).internalEmitter as EventEmitter2;
            const dummyPath: Record<string, PathInfo> = { key: { path: [{ x: 0, y: 0 }], cost: 1 } };
            internalEmitter.emit(InternalTurnEvents.ChangeTurn, { player: player1, path: dummyPath });
            expect(globalEmitter.emit).toHaveBeenCalledWith(InternalTurnEvents.ChangeTurn, {
                accessCode: room.accessCode,
                player: player1,
                path: dummyPath,
            });
        });

        it('should forward InternalTurnEvents.Start events', () => {
            const internalEmitter = (room as any).internalEmitter as EventEmitter2;
            internalEmitter.emit(InternalTurnEvents.Start, 'p1');
            expect(globalEmitter.emit).toHaveBeenCalledWith(InternalTurnEvents.Start, 'p1');
        });

        it('should forward InternalFightEvents.ChangeFighter events', () => {
            const internalEmitter = (room as any).internalEmitter as EventEmitter2;
            const fight = {} as Fight;
            internalEmitter.emit(InternalFightEvents.ChangeFighter, fight);
            expect(globalEmitter.emit).toHaveBeenCalledWith(InternalFightEvents.ChangeFighter, {
                accessCode: room.accessCode,
                fight,
            });
        });

        it('should forward InternalFightEvents.End events', () => {
            const internalEmitter = (room as any).internalEmitter as EventEmitter2;
            internalEmitter.emit(InternalFightEvents.End, { winner: player1, loser: player2 });
            expect(globalEmitter.emit).toHaveBeenCalledWith(InternalFightEvents.End, {
                accessCode: room.accessCode,
                winner: player1,
                loser: player2,
            });
        });
    });

    describe('Public methods', () => {
        it('setLock should update isLocked', () => {
            room.setLock(true);
            expect(room.isLocked).toBe(true);
            room.setLock(false);
            expect(room.isLocked).toBe(false);
        });

        it('isPlayerAdmin should return correct boolean', () => {
            expect(room.isPlayerAdmin('adminId')).toBe(true);
            expect(room.isPlayerAdmin('otherId')).toBe(false);
        });

        it('getPlayers should return game players', () => {
            fakeGame.players = [player1, player2];
            expect(room.getPlayers()).toEqual([player1, player2]);
        });

        describe('addPlayer', () => {
            it('should add player, generate a unique name if duplicate, and lock room if game is full', () => {
                // Simulate duplicate names
                const duplicatePlayer1 = createPlayer('p3', 'Alice');
                fakeGame.isGameFull.mockReturnValueOnce(false);
                room.addPlayer(player1);
                room.addPlayer(duplicatePlayer1);
                // Generated unique name
                expect(duplicatePlayer1.name).not.toBe('Alice');
                // Also test full room condition:
                fakeGame.isGameFull.mockReturnValueOnce(true);
                const newPlayer = createPlayer('p4', 'Charlie');
                room.addPlayer(newPlayer);
                expect(room.isLocked).toBe(true);
            });
        });

        describe('expelPlayer', () => {
            it('should remove player and emit PlayersUpdated', () => {
                fakeGame.players = [player1, player2];
                room.expelPlayer(player1.id);
                // Expect removePlayer to be called with playerBanMessage
                expect(fakeGame.removePlayer).toHaveBeenCalledWith(player1.id, expect.any(String));
                expect(globalEmitter.emit).toHaveBeenCalledWith(InternalRoomEvents.PlayersUpdated, {
                    accessCode: room.accessCode,
                    players: fakeGame.players,
                });
            });
        });

        describe('removePlayer (lobby branch)', () => {
            beforeEach(() => {
                // Set hasStarted false to take lobby branch
                fakeGame.hasStarted = false;
                // Reset global emitter spy
                jest.clearAllMocks();
            });

            it('should remove admin player from lobby and emit CloseRoom', () => {
                // Create a third player and change admin's id to match organizerId.
                const adminPlayer = createPlayer('adminId', 'Alice'); // admin now
                player2 = createPlayer('p2', 'Bob');
                const player3 = createPlayer('p3', 'Charlie');
                // Set fakeGame.players to three players: admin plus two others.
                fakeGame.players = [adminPlayer, player2, player3];
                room.removePlayer(adminPlayer.id);
                // In removePlayerFromLobby for an admin removal:
                //   for each non-admin player (2 players) -> 2 calls,
                //   plus one call for the admin => total 3 calls.
                expect(fakeGame.removePlayer).toHaveBeenCalledTimes(3);
                // Also, global emitter should emit CloseRoom event.
                expect(globalEmitter.emit).toHaveBeenCalledWith(InternalRoomEvents.CloseRoom, room.accessCode);
            });

            it('should remove non-admin player from lobby and emit PlayersUpdated', () => {
                const adminPlayer = createPlayer('adminId', 'Alice');
                player2 = createPlayer('p2', 'Bob');
                fakeGame.players = [adminPlayer, player2];
                room.removePlayer(player2.id);
                expect(fakeGame.removePlayer).toHaveBeenCalledWith(player2.id, expect.any(String));
                expect(globalEmitter.emit).toHaveBeenCalledWith(InternalRoomEvents.PlayersUpdated, {
                    accessCode: room.accessCode,
                    players: fakeGame.players,
                });
            });
        });

        describe('removePlayer (game branch)', () => {
            beforeEach(() => {
                // Set hasStarted true to take game branch.
                fakeGame.hasStarted = true;
                // Spy on private methods via game branch:
                jest.spyOn(fakeGame, 'removePlayerOnMap');
                jest.spyOn(fakeGame, 'removePlayer');
                fakeGame.players = [player1];
            });

            it('should remove player from game and if less than 2 players, remove last player and emit CloseRoom', () => {
                room.removePlayer(player1.id);
                expect(fakeGame.removePlayerOnMap).toHaveBeenCalledWith(player1.id);
                // Since players.length after removal would be <2, expect additional removal for last player and emit CloseRoom
                expect(fakeGame.removePlayer).toHaveBeenCalled();
                expect(globalEmitter.emit).toHaveBeenCalledWith(InternalRoomEvents.CloseRoom, room.accessCode);
            });

            it('should remove player from game and emit PlayersUpdated if more than 1 player', () => {
                fakeGame.hasStarted = true;
                fakeGame.players = [player1, player2];
                // For non-admin removal, remove player2.
                room.removePlayer(player2.id);
                // Expect removePlayerOnMap to have been called with player2.id.
                expect(fakeGame.removePlayerOnMap).toHaveBeenCalledWith(player2.id);
                expect(fakeGame.removePlayer).toHaveBeenCalledWith(player2.id, expect.any(String));
                expect(globalEmitter.emit).toHaveBeenCalledWith(InternalRoomEvents.PlayersUpdated, {
                    accessCode: room.accessCode,
                    players: fakeGame.players,
                });
            });

            it('should handle debug mode, fight and turn conditions', () => {
                // Set up debug mode branch and fight/turn conditions.
                // Make sure player1 is admin.
                player1 = createPlayer('adminId', 'Alice');
                fakeGame.players = [player1, player2];
                fakeGame.isDebugMode = true;
                // Set spies for fight and turn conditions.
                fakeGame.isPlayerInFight.mockReturnValue(true);
                fakeGame.isPlayerTurn.mockReturnValue(true);
                room.removePlayer(player1.id);
                // Should call removePlayerFromFight and endTurn.
                expect(fakeGame.removePlayerFromFight).toHaveBeenCalledWith(player1.id);
                expect(fakeGame.endTurn).toHaveBeenCalled();
                // Since player1 is admin and in debug mode, check that debug mode is switched off.
                expect(fakeGame.isDebugMode).toBe(false);
                expect(globalEmitter.emit).toHaveBeenCalledWith(InternalGameEvents.DebugStateChanged, {
                    accessCode: room.accessCode,
                    newState: false,
                });
            });
        });

        describe('closeRoom', () => {
            it('should stop timer, remove listeners, remove all players and nullify properties', () => {
                // Prepare fake players in game
                fakeGame.players = [player1, player2];
                room.closeRoom();
                // Timer stop should be called
                expect(fakeGame.timer.stopTimer).toHaveBeenCalled();
                // internal emitter removeAllListeners should be called
                expect(internalEmitterSpy).toHaveBeenCalled();
                // For each player, game.removePlayer should have been called
                expect(fakeGame.removePlayer).toHaveBeenCalled();
                // game.closeGame should be called and game nullified
                expect(fakeGame.closeGame).toHaveBeenCalled();
                expect(room.game).toBeNull();
                // globalEmitter and internalEmitter should be null
                expect((room as any).globalEmitter).toBeNull();
                expect((room as any).internalEmitter).toBeNull();
            });
        });
    });

    describe('Private helpers via public methods', () => {
        it('generateUniquePlayerName should assign a unique name if duplicate exists', () => {
            // Add a player with name "Sam"
            const playerA = createPlayer('pA', 'Sam');
            fakeGame.players = [playerA];
            // New player with same base name "Sam"
            const playerB = createPlayer('pB', 'Sam');
            room.addPlayer(playerB);
            expect(playerB.name).not.toBe('Sam');
            expect(playerB.name).toMatch(/Sam-\d+/);
        });
    });
});
