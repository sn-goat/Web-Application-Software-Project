/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable max-lines */
import { Fight } from '@app/class/fight';
import { Game } from '@app/class/game';
import { Player } from '@app/class/player';
import { Room } from '@app/class/room';
import { Timer } from '@app/class/timer';
import { InternalGameEvents, InternalRoomEvents, InternalStatsEvents, InternalTimerEvents, InternalTurnEvents } from '@app/constants/internal-events';
import { Board } from '@app/model/database/board';
import { Cell, Vec2 } from '@common/board';
import { ChatMessage } from '@common/chat';
import { Item, Tile, Visibility } from '@common/enums';
import { Avatar, GamePhase, PathInfo } from '@common/game';
import { mockStandardStats, Stats } from '@common/stats';
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
    gamePhase: GamePhase;
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
    startTurn: jest.Mock<any, any>;
    dropItems: jest.Mock<any, any>;
    getPhysicalPlayers: jest.Mock<any, any>;
    canGameContinue: jest.Mock<any, any>;
    fight: Fight;
}

const createFakeGame = (): FakeGame => {
    return {
        players: [],
        timer: { stopTimer: jest.fn() as any } as Timer,
        gamePhase: GamePhase.Lobby,
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
        startTurn: jest.fn(),
        dropItems: jest.fn(),
        getPhysicalPlayers: jest.fn(() => []),
        canGameContinue: jest.fn(() => true),
        // Ajout du mock pour fight
        fight: {
            isPlayerInFight: jest.fn(() => false),
            handleFightRemoval: jest.fn(),
        } as unknown as Fight,
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
        avatar: Avatar.Berserker,
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
            internalEmitter.emit(InternalRoomEvents.PlayerRemoved, 'p1', 'Test message');
            expect(globalEmitter.emit).toHaveBeenCalledWith(InternalRoomEvents.PlayerRemoved, room.accessCode, 'p1', 'Test message');
        });

        it('should forward InternalTimerEvents.TurnUpdate events', () => {
            const internalEmitter = (room as any).internalEmitter as EventEmitter2;
            internalEmitter.emit(InternalTimerEvents.TurnUpdate, 42);
            expect(globalEmitter.emit).toHaveBeenCalledWith(InternalTimerEvents.TurnUpdate, {
                accessCode: room.accessCode,
                remainingTime: 42,
            });
        });

        it('should forward InternalStatsEvents.DispatchStats events', () => {
            const internalEmitter = (room as any).internalEmitter as EventEmitter2;
            const stats: Stats = mockStandardStats;
            internalEmitter.emit(InternalStatsEvents.DispatchStats, stats);
            expect(globalEmitter.emit).toHaveBeenCalledWith(InternalStatsEvents.DispatchStats, {
                accessCode: room.accessCode,
                stats,
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
                duplicatePlayer1.avatar = Avatar.Chevalier;
                fakeGame.isGameFull.mockReturnValueOnce(false);
                room.addPlayer(player1);
                room.addPlayer(duplicatePlayer1);
                // Generated unique name
                expect(duplicatePlayer1.name).not.toBe('Alice');
                // Also test full room condition:
                fakeGame.isGameFull.mockReturnValueOnce(true);
                const newPlayer = createPlayer('p4', 'Charlie');
                newPlayer.avatar = Avatar.Clerc;
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
                fakeGame.gamePhase = GamePhase.Lobby;
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
                // Configurer le jeu comme démarré pour tester removePlayerFromGame
                fakeGame.gamePhase = GamePhase.InGame;
                // Ajouter canGameContinue à notre fakeGame
                (fakeGame as any).canGameContinue = jest.fn(() => true);
                // Propriété currentTurn et méthode startTurn nécessaires
                (fakeGame as any).currentTurn = 0;
                (fakeGame as any).startTurn = jest.fn();
                jest.clearAllMocks();
            });

            it('should remove player from game and emit PlayersUpdated', () => {
                fakeGame.players = [player1, player2];
                room.removePlayer(player1.id);

                expect(fakeGame.removePlayerOnMap).toHaveBeenCalledWith(player1.id);
                expect(fakeGame.removePlayer).toHaveBeenCalledWith(player1.id, expect.any(String));
                expect(fakeGame.dropItems).toHaveBeenCalledWith(player1.id);
                expect(globalEmitter.emit).toHaveBeenCalledWith(InternalRoomEvents.PlayersUpdated, {
                    accessCode: room.accessCode,
                    players: fakeGame.players,
                });
            });

            it('should close room when not enough players remain', () => {
                fakeGame.players = [player1];
                // Simuler que le jeu ne peut plus continuer
                fakeGame.canGameContinue.mockReturnValue(false);
                // Simuler un joueur physique restant
                fakeGame.getPhysicalPlayers.mockReturnValue([player1]);

                room.removePlayer(player1.id);

                // Vérifier que le joueur restant est supprimé
                expect(fakeGame.removePlayer).toHaveBeenCalledWith(player1.id, expect.any(String));
                // Vérifier que l'événement CloseRoom est émis
                expect(globalEmitter.emit).toHaveBeenCalledWith(InternalRoomEvents.CloseRoom, room.accessCode);
            });

            it('should disable debug mode when admin leaves', () => {
                const adminPlayer = createPlayer('adminId', 'Admin');
                fakeGame.players = [adminPlayer, player2];
                fakeGame.isDebugMode = true;

                room.removePlayer(adminPlayer.id);

                expect(fakeGame.isDebugMode).toBe(false);
                expect(globalEmitter.emit).toHaveBeenCalledWith(InternalGameEvents.DebugStateChanged, {
                    accessCode: room.accessCode,
                    newState: false,
                });
            });

            it('should remove player from fight if they are in one', () => {
                fakeGame.players = [player1, player2];
                fakeGame.isPlayerInFight.mockReturnValue(true);

                // Ajoutez les méthodes nécessaires au mock fight
                fakeGame.fight = {
                    isPlayerInFight: jest.fn(() => true),
                    handleFightRemoval: jest.fn(),
                    player1,
                    player2,
                } as unknown as Fight;

                room.removePlayer(player1.id);

                expect(fakeGame.fight.handleFightRemoval).toHaveBeenCalledWith(player1.id);
            });

            it("should start new turn if it was player's turn", () => {
                fakeGame.players = [player1, player2];
                fakeGame.isPlayerTurn.mockReturnValueOnce(true);
                (fakeGame as any).currentTurn = 0;

                room.removePlayer(player1.id);

                // Vérifier que currentTurn a été ajusté et qu'un nouveau tour commence
                expect(fakeGame.startTurn).toHaveBeenCalled();
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
            playerB.avatar = Avatar.Démoniste;
            room.addPlayer(playerB);
            expect(playerB.name).not.toBe('Sam');
            expect(playerB.name).toMatch(/Sam-\d+/);
        });
    });

    describe('removeAllPlayers', () => {
        it('should remove all players with confirmation message', () => {
            // Arrange
            fakeGame.players = [player1, player2];

            // Act
            room.removeAllPlayers();

            // Assert
            expect(fakeGame.removePlayer).toHaveBeenCalledTimes(2);
            expect(fakeGame.removePlayer).toHaveBeenCalledWith(player1.id, expect.stringContaining('succès'));
            expect(fakeGame.removePlayer).toHaveBeenCalledWith(player2.id, expect.stringContaining('succès'));
        });

        it('should work with empty player list', () => {
            // Arrange
            fakeGame.players = [];

            // Act
            room.removeAllPlayers();

            // Assert
            expect(fakeGame.removePlayer).not.toHaveBeenCalled();
        });
    });

    describe('addMessage', () => {
        it('should add message to chat history', () => {
            // Arrange
            const message: ChatMessage = {
                content: 'Bonjour tout le monde!',
            } as unknown as ChatMessage; // Cast to ChatMessage type

            // Vérifier que l'historique est vide au départ
            expect(room.chatHistory.length).toBe(0);

            // Act
            room.addMessage(message);

            // Assert
            expect(room.chatHistory.length).toBe(1);
            expect(room.chatHistory[0]).toBe(message);
        });

        it('should support adding multiple messages', () => {
            // Arrange
            const message1: ChatMessage = {
                content: 'Bonjour tout le monde!',
            } as unknown as ChatMessage; // Cast to ChatMessage type

            const message2: ChatMessage = {
                content: 'Bonjour tout le monde!',
            } as unknown as ChatMessage; // Cast to ChatMessage type

            // Act
            room.addMessage(message1);
            room.addMessage(message2);

            // Assert
            expect(room.chatHistory.length).toBe(2);
            expect(room.chatHistory[0]).toBe(message1);
            expect(room.chatHistory[1]).toBe(message2);
        });
    });

    // Enlever le bloc de mock existant qui ne fonctionne pas correctement
    // et ajouter ce bloc en haut de votre fichier (avant les imports):
    jest.mock('@app/class/virtual-player', () => {
        return {
            VirtualPlayer: jest.fn().mockImplementation((players, style) => {
                return {
                    id: 'virtual-id',
                    name: 'Virtual Player',
                    inventory: [],
                    virtualStyle: style,
                };
            }),
        };
    });

    // Puis modifier le test existant:
    describe('addVirtualPlayer', () => {
        // Importer directement le constructeur mockée
        let VirtualPlayerMock;

        beforeEach(() => {
            jest.clearAllMocks();
            // Récupérer le constructeur mocké depuis le module
            VirtualPlayerMock = require('@app/class/virtual-player').VirtualPlayer;
        });

        it('should create a virtual player and add it to the game', () => {
            // Arrange
            const playerStyle = 'beginner';
            fakeGame.isGameFull.mockReturnValue(false);

            // Act
            room.addVirtualPlayer(playerStyle as any);

            // Assert
            expect(fakeGame.addPlayer).toHaveBeenCalled();
            expect(room.isLocked).toBe(false);
        });

        it('should lock the room if game becomes full after adding virtual player', () => {
            // Arrange
            const playerStyle = 'expert';
            fakeGame.isGameFull.mockReturnValue(true);

            // Act
            room.addVirtualPlayer(playerStyle as any);

            // Assert
            expect(fakeGame.addPlayer).toHaveBeenCalled();
            expect(room.isLocked).toBe(true);
        });
    });
});
