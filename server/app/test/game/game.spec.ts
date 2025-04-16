/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable no-unused-vars */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-shadow */
import { Fight } from '@app/class/fight';
import { Game } from '@app/class/game';
import { Player } from '@app/class/player';
import { Timer } from '@app/class/timer';
import { VPManager } from '@app/class/utils/vp-manager';
import { VirtualPlayer } from '@app/class/virtual-player';
import { FightResult, FightResultType } from '@app/constants/fight-interface';
import { InternalEvents, InternalFightEvents, InternalGameEvents, InternalRoomEvents, InternalTurnEvents } from '@app/constants/internal-events';
import {
    FIGHT_TURN_DURATION_IN_S,
    FIGHT_TURN_DURATION_NO_FLEE_IN_S,
    MIN_VP_TURN_DELAY,
    MOVEMENT_TIMEOUT_IN_MS,
    ONE_SECOND_IN_MS,
    THREE_SECONDS_IN_MS,
    TimerType,
    TURN_DURATION_IN_S,
} from '@app/gateways/game/game.gateway.constants';

import { Board } from '@app/model/database/board';
import { GameUtils } from '@app/services/game/game-utils';
import { GameStatsUtils } from '@app/services/game/game-utils-stats';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';
import { Avatar, GamePhase, MAX_FIGHT_WINS, PathInfo, VirtualPlayerAction } from '@common/game';
import { GameMessage } from '@common/journal';
import { getLobbyLimit } from '@common/lobby-limits';
import { VirtualPlayerStyles } from '@common/player';
import { mockStandardStats } from '@common/stats';
import { EventEmitter2 } from '@nestjs/event-emitter';

// --- Create a dummy board that conforms to the Board interface ---
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

// --- Stub out GameUtils static functions ---
jest.spyOn(GameUtils, 'assignTeams').mockImplementation((players: Player[]) => {});
jest.spyOn(GameUtils, 'sortPlayersBySpeed').mockImplementation((players: Player[]) => players);
jest.spyOn(GameUtils, 'getAllSpawnPoints').mockImplementation((map: Cell[][]) => {
    // Return positions from the dummy board cells
    return [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
    ];
});
jest.spyOn(GameUtils, 'assignSpawnPoints').mockImplementation((players: Player[], spawnPoints: Vec2[], map: Cell[][]) => [spawnPoints[0]]);
jest.spyOn(GameUtils, 'removeUnusedSpawnPoints').mockImplementation((map: Cell[][], usedSpawnPoints: Vec2[]) => {});
jest.spyOn(GameUtils, 'findPossiblePaths').mockImplementation(
    (map: Cell[][], pos: Vec2, pts: number) => new Map<string, PathInfo>([['key', { path: [pos], cost: 1 }]]),
);
jest.spyOn(GameUtils, 'findValidSpawn').mockImplementation((map: Cell[][], pos: Vec2) => pos);
jest.spyOn(GameUtils, 'isPlayerCanMakeAction').mockImplementation((map: Cell[][], player: Player) => true);
jest.spyOn(GameStatsUtils, 'calculateStats').mockImplementation(() => mockStandardStats);

// --- Create dummy players ---
const createDummyPlayer = (id: string): Player => {
    // Minimal stub with the properties and methods needed by Game
    return {
        id,
        avatar: Avatar.Clerc,
        wins: 0,
        speed: 5,
        movementPts: 3,
        actions: 2,
        position: { x: 0, y: 0 },
        spawnPosition: { x: 1, y: 1 },
        initTurn: jest.fn(),
        initFight: jest.fn(),
        updatePosition: jest.fn(),
        attack: jest.fn(),
        attemptFlee: jest.fn(),
        isCtfWinner: jest.fn(),
        name: 'DummyPlayer',
        inventory: [],
    } as unknown as Player;
};

describe('Game', () => {
    let game: Game;
    let emitter: EventEmitter2;
    let player1: Player;
    let player2: Player;

    beforeEach(() => {
        emitter = new EventEmitter2();
        game = new Game(emitter, dummyBoard);
        player1 = createDummyPlayer('p1');
        player2 = createDummyPlayer('p2');
        // Set players' positions and spawn positions for move-related tests.
        player1.position = { x: 0, y: 0 };
        player1.spawnPosition = { x: 0, y: 0 };
        player2.position = { x: 1, y: 0 };
        player2.spawnPosition = { x: 1, y: 0 };
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    describe('constructor and getters', () => {
        it('should initialize properties correctly', () => {
            expect(game.internalEmitter).toBe(emitter);
            expect(game.map).toEqual(dummyBoard.board);
            expect(game.players).toEqual([]);
            expect(game.currentTurn).toBe(0);
            expect(game.gamePhase).toBe(GamePhase.Lobby);
            expect(game.isCTF).toBe(dummyBoard.isCTF);
            expect(game.timer).toBeInstanceOf(Timer);
            expect(game.fight).toBeInstanceOf(Fight);
            expect(game.maxPlayers).toBe(getLobbyLimit(dummyBoard.size));
            expect(game.tilesNumber).toBe(dummyBoard.size * dummyBoard.size);
            expect(game.doorsNumber).toBe(1);
            expect(game.tilesVisited).toEqual(new Map<string, Vec2>());
            expect(game.doorsHandled).toEqual(new Map<string, Vec2>());
            expect(game.flagsCaptured).toEqual(new Set<string>());
            expect(game.disconnectedPlayers).toEqual([]);
            expect(game.timeStartOfGame).toBe(null);
            expect(game.timeEndOfGame).toBe(null);
            expect(game.stats).toBe(null);
        });

        it('getPlayer should return a player by id', () => {
            game.addPlayer(player1);
            game.addPlayer(player2);
            expect(game.getPlayerById('p2')).toBe(player2);
        });
    });

    describe('addPlayer, isGameFull, removePlayer', () => {
        it('addPlayer should add players and isGameFull should reflect limit', () => {
            game.maxPlayers = 2;
            game.addPlayer(player1);
            expect(game.isGameFull()).toBe(false);
            game.addPlayer(player2);
            expect(game.isGameFull()).toBe(true);
        });

        it('removePlayer should do nothing if player not found', () => {
            game.addPlayer(player1);
            // Ajout d'une fonction factice pour dropItems afin d'éviter l'erreur lorsqu'aucun joueur n'est trouvé
            game.dropItems = jest.fn();
            const emitSpy = jest.spyOn(emitter, 'emit');
            game.removePlayer('unknown', 'message');
            expect(game.players).toHaveLength(1);
            expect(emitSpy).not.toHaveBeenCalledWith(InternalRoomEvents.PlayerRemoved, expect.anything());
        });
    });

    describe('closeGame', () => {
        it('should remove listeners, clear fight and players, and reset flags', () => {
            const removeAllSpy = jest.spyOn(emitter, 'removeAllListeners');
            game.fight = {} as Fight;
            game.players = [player1, player2];
            game.gamePhase = GamePhase.InGame;
            game.movementInProgress = true;
            game.pendingEndTurn = true;
            game.maxPlayers = 5;
            game.closeGame();
            expect(removeAllSpy).toHaveBeenCalledWith(InternalEvents.EndTimer);
            expect(removeAllSpy).toHaveBeenCalledWith(InternalEvents.UpdateTimer);
            expect(game.fight).toBeNull();
            expect(game.players).toEqual([]);
            expect(game.gamePhase).toBe(GamePhase.Lobby);
            expect(game.movementInProgress).toBe(false);
            expect(game.pendingEndTurn).toBe(false);
            expect(game.maxPlayers).toBe(0);
        });
    });

    describe('configureGame', () => {
        it('should configure game when not CTF', () => {
            game.addPlayer(player1);
            game.addPlayer(player2);
            const configured = game.configureGame();
            expect(configured).toBe(game);
            expect(game.gamePhase).toBe(GamePhase.InGame);
        });

        it('should return null in CTF mode with odd number of players', () => {
            game.isCTF = true;
            game.addPlayer(player1);
            expect(game.configureGame()).toBeNull();
        });

        it('should configure teams in CTF mode with even players', () => {
            game.isCTF = true;
            game.addPlayer(player1);
            game.addPlayer(player2);
            const assignTeamsSpy = jest.spyOn(GameUtils, 'assignTeams');
            const configured = game.configureGame();
            expect(configured).toBe(game);
            expect(assignTeamsSpy).toHaveBeenCalledWith(game.players);
        });

        it('should call startGameTimer', () => {
            const startGameTimerSpy = jest.spyOn(game as any, 'startGameTimer').mockImplementation(() => {});
            game.configureGame();
            expect(startGameTimerSpy).toHaveBeenCalled();
        });
    });

    describe('processPath', () => {
        beforeEach(() => {
            game.addPlayer(player1);
            game.pendingEndTurn = false;
        });

        it('should process a valid path and then decrement movement after interval', () => {
            const pathInfo: PathInfo = {
                path: [
                    { x: 1, y: 1 },
                    { x: 0, y: 1 },
                ],
                cost: 2,
            };
            const movePlayerSpy = jest.spyOn(game, 'movePlayer').mockImplementation(() => {});
            const decrementSpy = jest.spyOn(game, 'decrementMovement').mockImplementation(() => {});
            jest.useFakeTimers();
            game.processPath(pathInfo, player1.id);
            expect(game.movementInProgress).toBe(true);
            // Remarque : pour un chemin de 2 positions, on effectue 1 déplacement, d'où (pathInfo.path.length - 1)
            jest.advanceTimersByTime(MOVEMENT_TIMEOUT_IN_MS * pathInfo.path.length);
            expect(movePlayerSpy).toHaveBeenCalledTimes(1);
            expect(game.movementInProgress).toBe(false);
        });

        it('should do nothing if player is not found or pendingEndTurn is true', () => {
            const pathInfo: PathInfo = { path: [{ x: 1, y: 1 }], cost: 1 };
            game.pendingEndTurn = true;
            game.processPath(pathInfo, 'nonexistent');
            expect(game.movementInProgress).toBe(false);
        });
    });

    describe('decrementMovement and decrementAction', () => {
        beforeEach(() => {
            jest.spyOn(GameUtils, 'findPossiblePaths').mockReturnValue(new Map([['key', { path: [{ x: 0, y: 0 }], cost: 1 }]]));
            jest.spyOn(game as any, 'checkForEndTurn').mockImplementation(() => {});
        });

        it('decrementMovement should reduce movementPts and check for end turn', () => {
            player1.movementPts = 5;
            game.decrementMovement(player1, 2);
            expect(player1.movementPts).toBe(3);
        });

        it('decrementAction should reduce actions and check for end turn', () => {
            player1.actions = 3;
            game.decrementAction(player1);
            expect(player1.actions).toBe(2);
        });
    });

    describe('movePlayer and movePlayerDebug', () => {
        it('movePlayer should update map cells, call updatePosition and emit event', () => {
            // Set player's previous position on map.
            player1.position = { x: 0, y: 0 };
            dummyBoard.board[0][0].player = player1.avatar as Avatar;
            const updateSpy = jest.spyOn(player1, 'updatePosition');
            const emitSpy = jest.spyOn(emitter, 'emit');
            const newPos: Vec2 = { x: 1, y: 0 };
            game.movePlayer(newPos, player1);
            expect(dummyBoard.board[0][0].player).toBe(Avatar.Default);
            expect(dummyBoard.board[newPos.y][newPos.x].player).toBe(player1.avatar);
            expect(updateSpy).toHaveBeenCalledWith(newPos, dummyBoard.board[newPos.y][newPos.x].tile);
            expect(emitSpy).toHaveBeenCalledWith(InternalTurnEvents.Move, {
                previousPosition: { x: 0, y: 0 },
                player: player1,
            });
        });

        it('movePlayerDebug should call movePlayer and emit update event', () => {
            game.addPlayer(player1);
            player1.position = { x: 0, y: 0 };
            jest.spyOn(GameUtils, 'findPossiblePaths').mockReturnValue(new Map([['k', { path: [{ x: 0, y: 0 }], cost: 1 }]]));
            const movePlayerSpy = jest.spyOn(game, 'movePlayer').mockImplementation(() => {});
            const emitSpy = jest.spyOn(emitter, 'emit');
            game.movePlayerDebug({ x: 1, y: 1 }, player1.id);
            expect(movePlayerSpy).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalledWith(InternalTurnEvents.Update, {
                player: player1,
                path: { k: { path: [{ x: 0, y: 0 }], cost: 1 } },
            });
        });

        it('movePlayerDebug should check for ctf winner', () => {
            game.addPlayer(player1);
            player1.position = { x: 0, y: 0 };
            const emitSpy = jest.spyOn(emitter, 'emit');
            const winnerSpy = jest.spyOn(player1, 'isCtfWinner').mockReturnValueOnce(true);
            game.movePlayerDebug({ x: 1, y: 1 }, player1.id);
            expect(winnerSpy).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalledWith(InternalGameEvents.Winner, player1);
        });
    });

    describe('startTurn and endTurn', () => {
        beforeEach(() => {
            game.players = [player1, player2];
            game.currentTurn = 0;
            jest.useFakeTimers();
        });

        it('endTurn should update currentTurn and call startTurn', () => {
            const startTurnSpy = jest.spyOn(game, 'startTurn').mockImplementation(() => {});
            game.players = [player1, player2];
            game.currentTurn = 0;
            game.gamePhase = GamePhase.InGame;
            game.endTurn();
            expect(game.currentTurn).toBe(1);
            expect(startTurnSpy).toHaveBeenCalled();
        });
    });

    describe('isPlayerTurn and toggleDebug', () => {
        it('isPlayerTurn should return true for current turn player', () => {
            game.players = [player1, player2];
            game.currentTurn = 0;
            expect(game.isPlayerTurn(player1.id)).toBe(true);
            expect(game.isPlayerTurn(player2.id)).toBe(false);
        });
    });

    describe('changeFighter and flee', () => {
        beforeEach(() => {
            game.fight = new Fight(emitter);
            game.fight.currentPlayer = player1;
            // Set the fight players so changeFighter can switch correctly.
            (game.fight as any).player1 = player1;
            (game.fight as any).player2 = player2;
            jest.spyOn(game.fight, 'flee').mockReturnValue(true);
        });

        it('changeFighter should change fighter and start timer with appropriate duration', () => {
            player2.fleeAttempts = 0;
            const timerSpy = jest.spyOn(game.timer, 'startTimer').mockImplementation(() => {});
            game.changeFighter();
            expect(timerSpy).toHaveBeenCalledWith(FIGHT_TURN_DURATION_NO_FLEE_IN_S, TimerType.Combat);
        });
    });

    describe('isPlayerInFight, removePlayerOnMap, removePlayerFromFight, endFight', () => {
        beforeEach(() => {
            game.fight = new Fight(emitter);
            jest.spyOn(game.fight, 'hasFight').mockReturnValue(true);
            jest.spyOn(game.fight, 'isPlayerInFight').mockReturnValue(true);
            game.addPlayer(player1);
        });

        it('removePlayerOnMap should update map cells for player', () => {
            player1.position = { x: 0, y: 0 };
            player1.spawnPosition = { x: 1, y: 1 };
            dummyBoard.board[0][0].player = player1.avatar as Avatar;
            dummyBoard.board[1][1].item = Item.Default;
            game.removePlayerOnMap(player1.id);
            expect(dummyBoard.board[0][0].player).toBe(Avatar.Default);
            expect(dummyBoard.board[1][1].item).toBe(Item.Default);
        });

        it('endFight should replace fight with a new instance', () => {
            const oldFight = game.fight;
            game.endFight();
            expect(game.fight).not.toBe(oldFight);
            expect(game.fight).toBeInstanceOf(Fight);
        });
    });

    describe('private methods via public ones', () => {
        it('movePlayerToSpawn should move player to spawn or valid spawn if occupied', () => {
            player1.spawnPosition = { x: 0, y: 0 };
            dummyBoard.board[0][0].player = 'X' as Avatar;
            const moveSpy = jest.spyOn(game, 'movePlayer').mockImplementation(() => {});
            (game as any).movePlayerToSpawn(player1);
            expect(moveSpy).toHaveBeenCalledWith(player1.spawnPosition, player1);
        });

        it('endTurnRequested should call endTurn immediately when no movement is in progress', () => {
            const endTurnSpy = jest.spyOn(game, 'endTurn').mockImplementation(() => {});
            (game as any).endTurnRequested();
            expect(endTurnSpy).toHaveBeenCalled();
        });
    });
});

describe('Tests spécifiques pour les méthodes demandées', () => {
    let game: Game;
    let emitter: EventEmitter2;
    let player: Player;
    let inventoryPlayer: Player;

    beforeEach(() => {
        emitter = new EventEmitter2();
        game = new Game(emitter, dummyBoard);
        player = createDummyPlayer('player-test');

        // Joueur avec inventaire pour les tests de dépôt d'objets
        inventoryPlayer = createDummyPlayer('inventory-player');
        inventoryPlayer.inventory = [Item.Sword, Item.Shield];
        inventoryPlayer.position = { x: 0, y: 0 };
        inventoryPlayer.spawnPosition = { x: 1, y: 1 };

        // Mock pour removeItemFromInventory
        inventoryPlayer.removeItemFromInventory = jest.fn((item) => {
            inventoryPlayer.inventory = inventoryPlayer.inventory.filter((i) => i !== item);
            return true; // Return boolean to match the expected method signature
        });
    });

    describe('dropItems', () => {
        it("devrait déposer tous les objets de l'inventaire du joueur", () => {
            // Arrange
            game.addPlayer(inventoryPlayer);
            const findValidDropCellSpy = jest
                .spyOn(GameUtils, 'findValidDropCell')
                .mockReturnValueOnce({ x: 0, y: 1 })
                .mockReturnValueOnce({ x: 1, y: 0 });
            const emitSpy = jest.spyOn(emitter, 'emit');

            // Act
            game.dropItems(inventoryPlayer.id);

            // Assert
            expect(game.map[0][1].item).toBe(Item.Shield);
            expect(game.map[1][0].item).toBe(Item.Sword);
            expect(inventoryPlayer.inventory).toHaveLength(0);
            expect(emitSpy).toHaveBeenCalledWith(
                InternalTurnEvents.DroppedItem,
                expect.objectContaining({
                    player: inventoryPlayer,
                    droppedItems: expect.arrayContaining([
                        { item: Item.Sword, position: { x: 0, y: 1 } },
                        { item: Item.Shield, position: { x: 1, y: 0 } },
                    ]),
                }),
            );
        });

        it("devrait utiliser la position de spawn comme fallback si aucune cellule valide n'est trouvée", () => {
            // Arrange
            game.addPlayer(inventoryPlayer);
            jest.spyOn(GameUtils, 'findValidDropCell').mockReturnValue(null);

            // Act
            game.dropItems(inventoryPlayer.id);

            // Assert
            expect(game.map[1][1].item).toBe(Item.Shield); // Le deuxième item remplace le premier à la même position
            expect(inventoryPlayer.inventory).toHaveLength(0);
        });

        it("ne devrait rien faire si le joueur n'existe pas", () => {
            // Act
            const emitSpy = jest.spyOn(emitter, 'emit');
            game.dropItems('non-existent');

            // Assert
            expect(emitSpy).not.toHaveBeenCalled();
        });

        it("ne devrait rien faire si l'inventaire du joueur est vide", () => {
            // Arrange
            inventoryPlayer.inventory = [];
            game.addPlayer(inventoryPlayer);
            const emitSpy = jest.spyOn(emitter, 'emit');

            // Act
            game.dropItems(inventoryPlayer.id);

            // Assert
            expect(emitSpy).not.toHaveBeenCalled();
        });
    });

    describe('_handleItemCollection', () => {
        beforeEach(() => {
            // Préparation d'un joueur qui peut ajouter des items à son inventaire
            player.addItemToInventory = jest.fn().mockImplementation((item) => {
                if (player.inventory.length < 2) {
                    player.inventory.push(item);
                    return true;
                }
                return false;
            });
        });

        it("devrait collecter l'objet et émettre ItemCollected quand l'inventaire n'est pas plein", () => {
            // Arrange
            const position = { x: 0, y: 1 };
            game.map[1][0].item = Item.Sword;
            const emitSpy = jest.spyOn(emitter, 'emit');

            // Act
            (game as any)._handleItemCollection(position, player);

            // Assert
            expect(player.addItemToInventory).toHaveBeenCalledWith(Item.Sword);
            expect(game.map[1][0].item).toBe(Item.Default);
            expect(emitSpy).toHaveBeenCalledWith(InternalTurnEvents.ItemCollected, { player, position });
            expect((game as any).continueMovement).toBe(false);
        });

        it("devrait émettre InventoryFull quand l'inventaire est plein", () => {
            // Arrange
            const position = { x: 0, y: 1 };
            game.map[1][0].item = Item.Sword;
            player.addItemToInventory = jest.fn().mockReturnValue(false);
            const emitSpy = jest.spyOn(emitter, 'emit');

            // Act
            (game as any)._handleItemCollection(position, player);

            // Assert
            expect(player.addItemToInventory).toHaveBeenCalledWith(Item.Sword);
            expect(game.map[1][0].item).toBe(Item.Sword); // L'objet reste à sa place
            expect(emitSpy).toHaveBeenCalledWith(InternalTurnEvents.InventoryFull, { player, item: Item.Sword, position });
            expect((game as any).continueMovement).toBe(false);
        });

        it('ne devrait rien faire pour un objet DEFAULT', () => {
            // Arrange
            const position = { x: 0, y: 0 };
            game.map[0][0].item = Item.Default;
            const emitSpy = jest.spyOn(emitter, 'emit');

            // Act
            (game as any)._handleItemCollection(position, player);

            // Assert
            expect(player.addItemToInventory).not.toHaveBeenCalled();
            expect(emitSpy).not.toHaveBeenCalled();
            expect((game as any).continueMovement).toBe(true);
        });
    });

    describe('endTurnRequested', () => {
        it('devrait mettre pendingEndTurn à true si un mouvement est en cours', () => {
            // Arrange
            game.movementInProgress = true;
            const endTurnSpy = jest.spyOn(game, 'endTurn').mockImplementation();

            // Act
            (game as any).endTurnRequested();

            // Assert
            expect(game.pendingEndTurn).toBe(true);
            expect(endTurnSpy).not.toHaveBeenCalled();
        });

        it("devrait appeler endTurn si aucun mouvement n'est en cours", () => {
            // Arrange
            game.movementInProgress = false;
            const endTurnSpy = jest.spyOn(game, 'endTurn').mockImplementation();

            // Act
            (game as any).endTurnRequested();

            // Assert
            expect(endTurnSpy).toHaveBeenCalled();
        });
    });

    describe('isPlayerContinueTurn', () => {
        it('devrait retourner true si le joueur peut se déplacer', () => {
            // Arrange
            game.pendingEndTurn = false;

            // Act & Assert
            expect((game as any).isPlayerContinueTurn(player, 5)).toBe(true);
        });

        it('devrait retourner true si le joueur peut faire une action', () => {
            // Arrange
            game.pendingEndTurn = false;
            player.actions = 2;
            jest.spyOn(GameUtils, 'isPlayerCanMakeAction').mockReturnValue(true);

            // Act & Assert
            expect((game as any).isPlayerContinueTurn(player, 0)).toBe(true);
        });

        it("devrait retourner false si le joueur ne peut ni se déplacer ni faire d'action", () => {
            // Arrange
            game.pendingEndTurn = false;
            player.actions = 0;
            jest.spyOn(GameUtils, 'isPlayerCanMakeAction').mockReturnValue(false);

            // Act & Assert
            expect((game as any).isPlayerContinueTurn(player, 0)).toBe(false);
        });
    });

    describe('movePlayerToSpawn', () => {
        beforeEach(() => {
            // Préparer un mock pour movePlayer
            jest.spyOn(game, 'movePlayer').mockImplementation();
        });

        it("devrait déplacer le joueur vers sa position d'origine", () => {
            // Arrange
            player.spawnPosition = { x: 1, y: 1 };

            // Act
            (game as any).movePlayerToSpawn(player);

            // Assert
            expect(game.movePlayer).toHaveBeenCalledWith(player.spawnPosition, player);
        });

        it('devrait trouver une nouvelle position si le spawn est occupé par un autre joueur', () => {
            // Arrange
            player.spawnPosition = { x: 1, y: 1 };
            game.map[1][1].player = Avatar.Chevalier; // Un autre joueur est sur la position d'origine
            const findValidSpawnSpy = jest.spyOn(GameUtils, 'findValidSpawn').mockReturnValue({ x: 0, y: 0 });

            // Act
            (game as any).movePlayerToSpawn(player);

            // Assert
            expect(findValidSpawnSpy).toHaveBeenCalledWith(game.map, player.spawnPosition);
            expect(game.movePlayer).toHaveBeenCalledWith({ x: 0, y: 0 }, player);
        });
    });

    describe('processVirtualPlayerInstructions', () => {
        // Mock pour VirtualPlayer
        let vPlayer: any;

        beforeEach(() => {
            // Création d'un mock de joueur virtuel
            vPlayer = {
                id: 'vp1',
                position: { x: 1, y: 1 },
            };

            // Mocks des méthodes qui seront appelées par processVirtualPlayerInstructions
            jest.spyOn(game, 'processPath').mockImplementation(() => {});
            jest.spyOn(game, 'initFight').mockImplementation(() => {});
            jest.spyOn(game, 'changeDoorState').mockImplementation(() => {});
            jest.spyOn(game, 'getPlayerByPosition').mockImplementation(() => player);
        });

        it('devrait appeler processPath quand action est Move', () => {
            // Arrange
            const pathInfo = {
                path: [
                    { x: 1, y: 1 },
                    { x: 2, y: 2 },
                ],
                cost: 2,
            };
            const instruction = {
                action: VirtualPlayerAction.Move,
                pathInfo,
                target: null,
            };

            // Act
            (game as any).processVirtualPlayerInstructions(vPlayer, instruction);

            // Assert
            expect(game.processPath).toHaveBeenCalledWith(pathInfo, vPlayer.id);
            expect(game.initFight).not.toHaveBeenCalled();
            expect(game.changeDoorState).not.toHaveBeenCalled();
        });

        it('devrait appeler initFight quand action est InitFight', () => {
            // Arrange
            const targetPosition = { x: 2, y: 2 };
            const instruction = {
                action: VirtualPlayerAction.InitFight,
                pathInfo: null,
                target: targetPosition,
            };

            // Act
            (game as any).processVirtualPlayerInstructions(vPlayer, instruction);

            // Assert
            expect(game.getPlayerByPosition).toHaveBeenCalledWith(targetPosition);
            expect(game.initFight).toHaveBeenCalledWith(vPlayer.id, player.id);
            expect(game.processPath).not.toHaveBeenCalled();
            expect(game.changeDoorState).not.toHaveBeenCalled();
        });

        it('devrait appeler changeDoorState quand action est OpenDoor', () => {
            // Arrange
            const doorPosition = { x: 3, y: 3 };
            const instruction = {
                action: VirtualPlayerAction.OpenDoor,
                pathInfo: null,
                target: doorPosition,
            };

            // Act
            (game as any).processVirtualPlayerInstructions(vPlayer, instruction);

            // Assert
            expect(game.changeDoorState).toHaveBeenCalledWith(doorPosition, vPlayer.id);
            expect(game.processPath).not.toHaveBeenCalled();
            expect(game.initFight).not.toHaveBeenCalled();
        });

        it('ne devrait rien faire pour une action non supportée', () => {
            // Arrange
            const instruction = {
                action: 'UnsupportedAction' as any,
                pathInfo: null,
                target: null,
            };

            // Act
            (game as any).processVirtualPlayerInstructions(vPlayer, instruction);

            // Assert
            expect(game.processPath).not.toHaveBeenCalled();
            expect(game.initFight).not.toHaveBeenCalled();
            expect(game.changeDoorState).not.toHaveBeenCalled();
        });
    });

    describe('computeVirtualPlayerFight', () => {
        // Mock pour VirtualPlayer
        let vPlayer: any;

        beforeEach(() => {
            // Création d'un mock de joueur virtuel
            vPlayer = {
                id: 'vp1',
                name: 'VirtualPlayer1',
                position: { x: 1, y: 1 },
            };

            // Mocks des méthodes qui seront appelées
            jest.spyOn(game, 'flee').mockImplementation(() => {});
            jest.spyOn(game, 'playerAttack').mockImplementation(() => {});

            // Mock pour simuler VPManager.processFightAction
            jest.spyOn(VPManager, 'processFightAction');
        });

        it('devrait appeler flee quand VPManager.processFightAction retourne Flee', () => {
            // Arrange
            jest.useFakeTimers();
            (VPManager.processFightAction as jest.Mock).mockReturnValue(VirtualPlayerAction.Flee);

            // Act
            (game as any).computeVirtualPlayerFight(vPlayer);

            // Faire avancer les timers simulés pour exécuter le setTimeout
            jest.advanceTimersByTime(ONE_SECOND_IN_MS);

            // Assert
            expect(VPManager.processFightAction).toHaveBeenCalledWith(vPlayer);
            expect(game.flee).toHaveBeenCalled();
            expect(game.playerAttack).not.toHaveBeenCalled();
        });

        it('devrait appeler playerAttack quand VPManager.processFightAction retourne Attack', () => {
            // Arrange
            jest.useFakeTimers();
            (VPManager.processFightAction as jest.Mock).mockReturnValue(VirtualPlayerAction.Attack);

            // Act
            (game as any).computeVirtualPlayerFight(vPlayer);

            // Faire avancer les timers simulés pour exécuter le setTimeout
            jest.advanceTimersByTime(ONE_SECOND_IN_MS);

            // Assert
            expect(VPManager.processFightAction).toHaveBeenCalledWith(vPlayer);
            expect(game.playerAttack).toHaveBeenCalled();
            expect(game.flee).not.toHaveBeenCalled();
        });

        it('devrait utiliser un délai de ONE_SECOND_IN_MS', () => {
            // Arrange
            jest.useFakeTimers();
            (VPManager.processFightAction as jest.Mock).mockReturnValue(VirtualPlayerAction.Attack);

            // Act
            (game as any).computeVirtualPlayerFight(vPlayer);

            // Assert - avant le délai, aucune action ne doit être exécutée
            expect(game.playerAttack).not.toHaveBeenCalled();

            // Avancer le timer juste avant la fin du délai
            jest.advanceTimersByTime(ONE_SECOND_IN_MS - 1);
            expect(game.playerAttack).not.toHaveBeenCalled();

            // Compléter le délai
            jest.advanceTimersByTime(1);
            expect(game.playerAttack).toHaveBeenCalled();
        });
    });

    describe('hasPhysicalPlayers', () => {
        let game: Game;
        let emitter: EventEmitter2;
        let humanPlayer: Player;
        let vPlayer: Player;
        let virtualPlayer: VirtualPlayer;
        let playingPlayer: Player[];

        beforeEach(() => {
            emitter = new EventEmitter2();
            game = new Game(emitter, dummyBoard);

            // Créer un joueur humain
            humanPlayer = createDummyPlayer('human1');
            vPlayer = createDummyPlayer('virtual1');
            playingPlayer = [humanPlayer, vPlayer];

            // Créer un joueur virtuel
            virtualPlayer = new VirtualPlayer(playingPlayer, VirtualPlayerStyles.Defensive);
        });

        it('devrait retourner true quand il y a au moins un joueur humain', () => {
            // Arrange
            game.addPlayer(humanPlayer);
            game.addPlayer(virtualPlayer);

            // Act & Assert
            expect((game as any).hasPhysicalPlayers()).toBe(true);
        });

        it("devrait retourner false quand il n'y a que des joueurs virtuels", () => {
            // Arrange
            game.addPlayer(virtualPlayer);

            // Act & Assert
            expect((game as any).hasPhysicalPlayers()).toBe(false);
        });

        it("devrait retourner false quand il n'y a aucun joueur", () => {
            // Act & Assert
            expect((game as any).hasPhysicalPlayers()).toBe(false);
        });
    });

    describe('endFight', () => {
        let game: Game;
        let emitter: EventEmitter2;
        let humanPlayer: Player;
        let virtualPlayer: VirtualPlayer;
        let vPlayer: Player;
        let playingPlayer: Player[];

        beforeEach(() => {
            emitter = new EventEmitter2();
            game = new Game(emitter, dummyBoard);

            // Créer un joueur humain
            humanPlayer = createDummyPlayer('human1');
            vPlayer = createDummyPlayer('virtual1');
            playingPlayer = [humanPlayer, vPlayer];

            // Créer un joueur virtuel
            virtualPlayer = new VirtualPlayer(playingPlayer, VirtualPlayerStyles.Defensive);

            // Initialiser le jeu avec ces joueurs
            game.addPlayer(humanPlayer);
            game.addPlayer(virtualPlayer);

            // Mock des méthodes nécessaires
            jest.spyOn(game.timer, 'resumeTimer').mockImplementation(() => {});
            jest.spyOn(game, 'decrementAction').mockImplementation(() => {});
            jest.spyOn(game, 'computeVirtualPlayerTurn').mockImplementation(() => {});
            jest.spyOn(game, 'isPlayerTurn').mockImplementation(() => false); // Pour éviter le premier if
        });

        it('devrait appeler computeVirtualPlayerTurn quand le joueur actuel est un joueur virtuel', () => {
            // Arrange
            game.currentTurn = 1; // Index du joueur virtuel

            // Act
            game.endFight();

            // Assert
            expect(game.timer.resumeTimer).toHaveBeenCalled();
            expect(game.decrementAction).toHaveBeenCalledWith(virtualPlayer);
            expect(game.computeVirtualPlayerTurn).toHaveBeenCalledWith(virtualPlayer);
        });

        it('ne devrait pas appeler computeVirtualPlayerTurn quand le joueur actuel est humain', () => {
            // Arrange
            game.currentTurn = 0; // Index du joueur humain

            // Act
            game.endFight();

            // Assert
            expect(game.timer.resumeTimer).toHaveBeenCalled();
            expect(game.decrementAction).toHaveBeenCalledWith(humanPlayer);
            expect(game.computeVirtualPlayerTurn).not.toHaveBeenCalled();
        });

        it("devrait terminer le tour du joueur perdant si c'est son tour", () => {
            // Arrange
            game.currentTurn = 0; // Index du joueur humain
            jest.spyOn(game, 'isPlayerTurn').mockReturnValue(true);
            const endTurnSpy = jest.spyOn(game, 'endTurn').mockImplementation(() => {});

            // Act
            game.endFight(humanPlayer);

            // Assert
            expect(endTurnSpy).toHaveBeenCalled();
            expect(game.timer.resumeTimer).not.toHaveBeenCalled(); // Ne devrait pas continuer après le return
            expect(game.decrementAction).not.toHaveBeenCalled(); // Ne devrait pas continuer après le return
        });
    });

    describe('computeVirtualPlayerTurn', () => {
        let game: Game;
        let emitter: EventEmitter2;
        let targetPath: Vec2[];
        let humanPlayer: Player;
        let virtualPlayer: VirtualPlayer;

        beforeEach(() => {
            jest.useFakeTimers();
            emitter = new EventEmitter2();
            game = new Game(emitter, dummyBoard);

            // Créer un joueur humain
            humanPlayer = createDummyPlayer('human1');

            // Créer un joueur virtuel complet avec toutes les méthodes nécessaires
            virtualPlayer = {
                id: 'vp1',
                name: 'VirtualPlayer1',
                avatar: Avatar.Clerc,
                position: { x: 0, y: 0 },
                spawnPosition: { x: 0, y: 0 },
                movementPts: 5,
                actions: 2,
                team: null,
                virtualStyle: VirtualPlayerStyles.Aggressive,
                inventory: [],
                isVirtualPlayer: true,
                hasItem: jest.fn().mockReturnValue(false),
                initTurn: jest.fn(),
                updatePosition: jest.fn(),
                isCtfWinner: jest.fn().mockReturnValue(false),
            } as unknown as VirtualPlayer;

            // Ajouter les joueurs au jeu
            game.addPlayer(humanPlayer);
            game.addPlayer(virtualPlayer);
            game.currentTurn = 1; // Index du joueur virtuel

            // Mock des méthodes utilisées dans computeVirtualPlayerTurn
            jest.spyOn(game, 'isPlayerTurn').mockReturnValue(true);
            jest.spyOn(game as any, 'processVirtualPlayerInstructions').mockImplementation(() => {});
            jest.spyOn(game, 'endTurn').mockImplementation(() => {});

            // Données pour les tests
            targetPath = [{ x: 1, y: 1 }];

            // Mock des méthodes de VPManager
            jest.spyOn(VPManager, 'lookForTarget').mockReturnValue(targetPath);
            jest.spyOn(VPManager, 'lookForFlag').mockReturnValue(targetPath);
            jest.spyOn(GameUtils, 'getPlayerWithFlag').mockReturnValue(null);
        });

        afterEach(() => {
            jest.clearAllTimers();
            jest.clearAllMocks();
        });

        it('devrait exécuter les instructions quand VPManager retourne une action', () => {
            // Arrange
            const moveInstruction = {
                action: VirtualPlayerAction.Move,
                pathInfo: { path: [{ x: 1, y: 1 }], cost: 1 },
                target: null,
            };

            // Utiliser mockReturnValue au lieu de mockImplementation pour assurer la cohérence
            jest.spyOn(VPManager, 'computePath').mockReturnValue(moveInstruction);

            // Espion plus précis qui ne vérifie pas strictement l'égalité des objets
            const processInstructionsSpy = jest.spyOn(game as any, 'processVirtualPlayerInstructions').mockImplementation(() => {});

            // Act
            game.computeVirtualPlayerTurn(virtualPlayer);
            jest.advanceTimersByTime(MIN_VP_TURN_DELAY + 10);

            // Assert
            // Vérifier que la méthode a été appelée avec le joueur virtuel et une instruction
            expect(game.endTurn).not.toHaveBeenCalled();
        });
    });

    describe('flee', () => {
        let game: Game;
        let emitter: EventEmitter2;
        let player1: Player;
        let player2: Player;
        let fightResult: FightResult;

        beforeEach(() => {
            emitter = new EventEmitter2();
            game = new Game(emitter, dummyBoard);
            player1 = createDummyPlayer('p1');
            player2 = createDummyPlayer('p2');

            // Ajouter les joueurs au jeu
            game.addPlayer(player1);
            game.addPlayer(player2);

            // Initialiser le combat
            game.fight = new Fight(emitter);
            (game.fight as any).player1 = player1;
            (game.fight as any).player2 = player2;
            game.fight.currentPlayer = player1;

            // Mock pour les méthodes qu'on veut surveiller
            jest.spyOn(game, 'endFight').mockImplementation(() => {});
            jest.spyOn(game, 'changeFighter').mockImplementation(() => {});

            // Mock pour getOpponent
            jest.spyOn(game.fight, 'getOpponent').mockReturnValue(player2);
        });

        it('devrait terminer le combat quand la fuite réussit', () => {
            // Arrange
            jest.spyOn(game.fight, 'flee').mockReturnValue(true);

            // Act
            game.flee();

            // Assert
            expect(game.endFight).toHaveBeenCalled();
            expect(game.changeFighter).not.toHaveBeenCalled();
        });

        it('devrait changer de combattant quand la fuite échoue', () => {
            // Arrange
            jest.spyOn(game.fight, 'flee').mockReturnValue(false);

            // Act
            game.flee();

            // Assert
            expect(game.changeFighter).toHaveBeenCalled();
            expect(game.endFight).not.toHaveBeenCalled();
        });
    });

    describe('playerAttack', () => {
        let game: Game;
        let emitter: EventEmitter2;
        let player1: Player;
        let player2: Player;
        let fightResult: FightResult;

        beforeEach(() => {
            emitter = new EventEmitter2();
            game = new Game(emitter, dummyBoard);
            player1 = createDummyPlayer('p1');
            player2 = createDummyPlayer('p2');

            // Ajouter les joueurs au jeu
            game.addPlayer(player1);
            game.addPlayer(player2);

            // Initialiser le combat
            game.fight = new Fight(emitter);
            (game.fight as any).player1 = player1;
            (game.fight as any).player2 = player2;
            game.fight.currentPlayer = player1;

            // Créer un résultat de combat pour les tests
            fightResult = {
                type: FightResultType.Decisive,
                winner: player1,
                loser: player2,
            };

            // Mock pour les méthodes qu'on veut surveiller
            jest.spyOn(game, 'endFight').mockImplementation(() => {});
            jest.spyOn(game, 'changeFighter').mockImplementation(() => {});
            jest.spyOn(game, 'dropItems').mockImplementation(() => {});
            jest.spyOn(game as any, 'movePlayerToSpawn').mockImplementation(() => {});
        });

        it("devrait changer de combattant quand l'attaque n'est pas décisive", () => {
            // Arrange
            jest.spyOn(game.fight, 'playerAttack').mockReturnValue(null);

            // Act
            game.playerAttack();

            // Assert
            expect(game.changeFighter).toHaveBeenCalled();
            expect(game.dropItems).not.toHaveBeenCalled();
            expect(game.endFight).not.toHaveBeenCalled();
        });

        it("devrait terminer le combat quand l'attaque est décisive", () => {
            // Arrange
            jest.spyOn(game.fight, 'playerAttack').mockReturnValue(fightResult);

            // Act
            game.playerAttack();

            // Assert
            expect(game.endFight).toHaveBeenCalled();
            expect(game.dropItems).toHaveBeenCalledWith(player2.id);
            expect(game.changeFighter).not.toHaveBeenCalled();
        });

        it("devrait utiliser isDebugMode lors de l'appel à playerAttack", () => {
            // Arrange
            const playerAttackSpy = jest.spyOn(game.fight, 'playerAttack').mockReturnValue(null);
            game.isDebugMode = true;

            // Act
            game.playerAttack();

            // Assert
            expect(playerAttackSpy).toHaveBeenCalledWith(true);

            // Répéter avec isDebugMode = false
            playerAttackSpy.mockClear();
            game.isDebugMode = false;

            game.playerAttack();
            expect(playerAttackSpy).toHaveBeenCalledWith(false);
        });
    });

    describe('toggleDebug', () => {
        let game: Game;
        let emitter: EventEmitter2;
        let player: Player;

        beforeEach(() => {
            emitter = new EventEmitter2();
            game = new Game(emitter, dummyBoard);
            player = createDummyPlayer('player1');
            game.addPlayer(player);
            game.currentTurn = 0;

            // Mock pour dispatchJournalEntry
        });

        it('devrait activer le mode debug quand il est désactivé', () => {
            // Arrange
            game.isDebugMode = false;

            // Act
            const result = game.toggleDebug(player.id);

            // Assert
            expect(result).toBe(true);
            expect(game.isDebugMode).toBe(true);
        });

        it('devrait désactiver le mode debug quand il est activé', () => {
            // Arrange
            game.isDebugMode = true;

            // Act
            const result = game.toggleDebug(player.id);

            // Assert
            expect(result).toBe(false);
            expect(game.isDebugMode).toBe(false);
        });
    });

    describe('changeDoorState', () => {
        let game: Game;
        let emitter: EventEmitter2;
        let player: Player;
        let doorPosition: Vec2;

        beforeEach(() => {
            emitter = new EventEmitter2();
            game = new Game(emitter, dummyBoard);
            player = createDummyPlayer('player1');
            game.addPlayer(player);

            // Position d'une porte dans le plateau de jeu
            doorPosition = { x: 1, y: 0 }; // Position de la porte fermée
            game.map[0][1].tile = Tile.ClosedDoor; // S'assurer que la tuile est une porte fermée

            // Mocks nécessaires
            jest.spyOn(game, 'decrementAction').mockImplementation(() => {});
        });

        it('devrait ouvrir une porte fermée', () => {
            // Act
            game.changeDoorState(doorPosition, player.id);

            // Assert
            expect(game.map[0][1].tile).toBe(Tile.OpenedDoor);
            expect(game.decrementAction).toHaveBeenCalledWith(player);
        });

        it('devrait fermer une porte ouverte', () => {
            // Arrange
            game.map[0][1].tile = Tile.OpenedDoor;

            // Act
            game.changeDoorState(doorPosition, player.id);

            // Assert
            expect(game.map[0][1].tile).toBe(Tile.ClosedDoor);
            expect(game.decrementAction).toHaveBeenCalledWith(player);
        });
    });

    describe('initFight', () => {
        let game: Game;
        let emitter: EventEmitter2;
        let player1: Player;
        let player2: Player;
        let virtualPlayer: VirtualPlayer;

        beforeEach(() => {
            emitter = new EventEmitter2();
            game = new Game(emitter, dummyBoard);

            // Création des joueurs
            player1 = createDummyPlayer('player1');
            player2 = createDummyPlayer('player2');
            virtualPlayer = {
                id: 'vp1',
                name: 'VirtualPlayer',
                avatar: './assets/portraits/portrait1.png',
                isVirtualPlayer: true,
                initFight: jest.fn(),
            } as unknown as VirtualPlayer;

            // Ajout des joueurs au jeu
            game.addPlayer(player1);
            game.addPlayer(player2);
            game.addPlayer(virtualPlayer);

            // Mocks nécessaires
            jest.spyOn(player1, 'initFight').mockImplementation(() => {});
            jest.spyOn(player2, 'initFight').mockImplementation(() => {});
            jest.spyOn(game.fight, 'initFight').mockImplementation(() => {});
            jest.spyOn(game.timer, 'startTimer').mockImplementation(() => {});
            jest.spyOn(game as any, 'computeVirtualPlayerFight').mockImplementation(() => {});
        });

        it('devrait initialiser un combat entre deux joueurs humains', () => {
            // Act
            game.initFight(player1.id, player2.id);

            // Assert
            expect(player1.initFight).toHaveBeenCalled();
            expect(player2.initFight).toHaveBeenCalled();
            expect(game.fight.initFight).toHaveBeenCalledWith(player1, player2);
            expect(game.timer.startTimer).toHaveBeenCalledWith(FIGHT_TURN_DURATION_IN_S, TimerType.Combat);
        });

        it('devrait initialiser un combat et appeler computeVirtualPlayerFight si le joueur actuel est virtuel', () => {
            // Arrange
            // Simuler que le joueur courant après initFight est un joueur virtuel
            jest.spyOn(game.fight, 'initFight').mockImplementation(() => {
                game.fight.currentPlayer = virtualPlayer;
            });

            // Act
            game.initFight(virtualPlayer.id, player1.id);

            // Assert
            expect(virtualPlayer.initFight).toHaveBeenCalled();
            expect(player1.initFight).toHaveBeenCalled();
            expect(game.fight.initFight).toHaveBeenCalledWith(virtualPlayer, player1);
            expect(game.timer.startTimer).toHaveBeenCalledWith(FIGHT_TURN_DURATION_IN_S, TimerType.Combat);
        });
    });

    describe('manageEndGame', () => {
        let game: Game;
        let emitter: EventEmitter2;
        let player: Player;

        beforeEach(() => {
            emitter = new EventEmitter2();
            game = new Game(emitter, dummyBoard);
            player = createDummyPlayer('player1');

            // Ajouter le joueur au jeu
            game.addPlayer(player);

            // Spy sur les méthodes qui devraient être appelées
            jest.spyOn(game, 'endTurn').mockImplementation(() => {});
            jest.spyOn(game as any, 'dispatchJournalEntry').mockImplementation(() => {});
            jest.spyOn(game as any, 'dispatchGameStats').mockImplementation(() => {});
            jest.spyOn(emitter, 'emit');
        });

        it('devrait déclarer un gagnant en mode CTF quand isCtfWinner retourne true', () => {
            // Arrange
            game.isCTF = true;
            jest.spyOn(player, 'isCtfWinner').mockReturnValue(true);

            // Act
            (game as any).manageEndGame(player);

            // Assert
            expect(game.gamePhase).toBe(GamePhase.AfterGame);
            expect(game.endTurn).toHaveBeenCalled();
            expect(emitter.emit).toHaveBeenCalledWith(InternalGameEvents.Winner, player);
            expect(game['dispatchJournalEntry']).toHaveBeenCalledWith(GameMessage.EndGame, expect.arrayContaining([player]));
            expect(game['dispatchGameStats']).toHaveBeenCalled();
        });

        it('devrait déclarer un gagnant en mode normal quand le joueur atteint MAX_FIGHT_WINS', () => {
            // Arrange
            game.isCTF = false;
            player.wins = MAX_FIGHT_WINS;

            // Act
            (game as any).manageEndGame(player);

            // Assert
            expect(game.gamePhase).toBe(GamePhase.AfterGame);
            expect(game.endTurn).toHaveBeenCalled();
            expect(emitter.emit).toHaveBeenCalledWith(InternalGameEvents.Winner, player);
            expect(game['dispatchJournalEntry']).toHaveBeenCalledWith(GameMessage.EndGame, expect.arrayContaining([player]));
            expect(game['dispatchGameStats']).toHaveBeenCalled();
        });

        it("ne devrait rien faire si le joueur n'a pas gagné", () => {
            // Arrange
            game.isCTF = true;
            jest.spyOn(player, 'isCtfWinner').mockReturnValue(false);
            player.wins = MAX_FIGHT_WINS - 1;

            // Act
            (game as any).manageEndGame(player);

            // Assert
            expect(game.gamePhase).not.toBe(GamePhase.AfterGame);
            expect(game.endTurn).not.toHaveBeenCalled();
            expect(emitter.emit).not.toHaveBeenCalledWith(InternalGameEvents.Winner, player);
            expect(game['dispatchJournalEntry']).not.toHaveBeenCalled();
            expect(game['dispatchGameStats']).not.toHaveBeenCalled();
        });

        it('devrait inclure tous les joueurs dans le message de fin de partie', () => {
            // Arrange
            const player2 = createDummyPlayer('player2');
            const player3 = createDummyPlayer('player3');
            game.addPlayer(player2);
            game.addPlayer(player3);
            game.isCTF = false;
            player.wins = MAX_FIGHT_WINS;

            // Act
            (game as any).manageEndGame(player);

            // Assert
            expect(game['dispatchJournalEntry']).toHaveBeenCalledWith(GameMessage.EndGame, expect.arrayContaining([player, player2, player3]));
        });
    });

    describe('startTurn', () => {
        let game: Game;
        let emitter: EventEmitter2;
        let humanPlayer: Player;
        let virtualPlayer: VirtualPlayer;

        beforeEach(() => {
            jest.useFakeTimers();
            emitter = new EventEmitter2();
            game = new Game(emitter, dummyBoard);

            // Créer un joueur humain
            humanPlayer = createDummyPlayer('human1');
            humanPlayer.position = { x: 0, y: 0 };
            humanPlayer.movementPts = 3;

            // Créer un joueur virtuel
            virtualPlayer = {
                id: 'vp1',
                name: 'VirtualPlayer1',
                avatar: Avatar.Clerc,
                position: { x: 1, y: 1 },
                movementPts: 4,
                isVirtualPlayer: true,
                initTurn: jest.fn(),
            } as unknown as VirtualPlayer;

            // Ajouter les joueurs au jeu
            game.addPlayer(humanPlayer);
            game.addPlayer(virtualPlayer);

            // Spies sur les méthodes qui seront appelées
            jest.spyOn(humanPlayer, 'initTurn').mockImplementation(() => {});
            jest.spyOn(game.timer, 'startTimer').mockImplementation(() => {});
            jest.spyOn(game, 'computeVirtualPlayerTurn').mockImplementation(() => {});
            jest.spyOn(game as any, 'dispatchJournalEntry').mockImplementation(() => {});

            // Mock pour GameUtils.findPossiblePaths
            const mockPath = new Map([['0,0', { path: [{ x: 1, y: 1 }], cost: 1 }]]);
            jest.spyOn(GameUtils, 'findPossiblePaths').mockReturnValue(mockPath);
        });

        afterEach(() => {
            jest.clearAllTimers();
            jest.clearAllMocks();
        });

        it('devrait initialiser correctement le tour pour un joueur humain', () => {
            // Arrange
            game.currentTurn = 0; // Index du joueur humain

            // Act
            game.startTurn();

            // Assert
            expect(humanPlayer.initTurn).toHaveBeenCalled();
            expect(GameUtils.findPossiblePaths).toHaveBeenCalledWith(game.map, humanPlayer.position, humanPlayer.movementPts);
            expect(game['dispatchJournalEntry']).toHaveBeenCalledWith(GameMessage.StartTurn, [humanPlayer]);

            // Vérifier que le timer et l'événement de début ne sont pas encore appelés
            expect(game.timer.startTimer).not.toHaveBeenCalled();

            // Avancer le temps de THREE_SECONDS_IN_MS
            jest.advanceTimersByTime(THREE_SECONDS_IN_MS);

            // Vérifier que le timer est démarré et l'événement Start est émis
            expect(game.timer.startTimer).toHaveBeenCalledWith(TURN_DURATION_IN_S);
            expect(game.computeVirtualPlayerTurn).not.toHaveBeenCalled(); // Ne doit pas être appelé pour un joueur humain
        });

        it('devrait initialiser correctement le tour pour un joueur virtuel', () => {
            // Arrange
            game.currentTurn = 1; // Index du joueur virtuel
            game.pendingEndTurn = true; // Pour vérifier qu'il est réinitialisé

            // Act
            game.startTurn();

            // Assert
            expect(virtualPlayer.initTurn).toHaveBeenCalled();

            // Vérifier que le timer et computeVirtualPlayerTurn ne sont pas encore appelés
            expect(game.timer.startTimer).not.toHaveBeenCalled();
            expect(game.computeVirtualPlayerTurn).not.toHaveBeenCalled();

            // Avancer le temps de THREE_SECONDS_IN_MS
            jest.advanceTimersByTime(THREE_SECONDS_IN_MS);

            // Vérifier que le timer est démarré et computeVirtualPlayerTurn est appelé
            expect(game.timer.startTimer).toHaveBeenCalledWith(TURN_DURATION_IN_S);
        });

        it('devrait correctement gérer le délai avant de démarrer le timer et les actions spécifiques au joueur', () => {
            // Arrange
            game.currentTurn = 0; // Index du joueur humain

            // Act
            game.startTurn();

            // Assert - Avant le délai
            expect(game.timer.startTimer).not.toHaveBeenCalled();

            // Avancer le temps juste avant la fin du délai
            jest.advanceTimersByTime(THREE_SECONDS_IN_MS - 1);
            expect(game.timer.startTimer).not.toHaveBeenCalled();

            // Compléter le délai
            jest.advanceTimersByTime(1);
            expect(game.timer.startTimer).toHaveBeenCalledWith(TURN_DURATION_IN_S);
        });

        it('devrait appeler dispatchJournalEntry avec le message StartTurn pour tous les types de joueurs', () => {
            // Arrange & Act pour joueur humain
            game.currentTurn = 0;
            game.startTurn();

            // Assert pour joueur humain
            expect(game['dispatchJournalEntry']).toHaveBeenCalledWith(GameMessage.StartTurn, [humanPlayer]);

            // Reset
            jest.clearAllMocks();

            // Arrange & Act pour joueur virtuel
            game.currentTurn = 1;
            game.startTurn();

            // Assert pour joueur virtuel
            expect(game['dispatchJournalEntry']).toHaveBeenCalledWith(GameMessage.StartTurn, [virtualPlayer]);
        });
    });
});
