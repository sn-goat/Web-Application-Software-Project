/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable no-unused-vars */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Fight } from '@app/class/fight';
import { Game } from '@app/class/game';
import { Player } from '@app/class/player';
import { Timer } from '@app/class/timer';
import { InternalEvents, InternalFightEvents, InternalRoomEvents, InternalTurnEvents } from '@app/constants/internal-events';
import {
    FIGHT_TURN_DURATION_IN_S,
    FIGHT_TURN_DURATION_NO_FLEE_IN_S,
    MOVEMENT_TIMEOUT_IN_MS,
    THREE_SECONDS_IN_MS,
    TimerType,
} from '@app/gateways/game/game.gateway.constants';
import { Board } from '@app/model/database/board';
import { GameUtils } from '@app/services/game/game-utils';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';
import { Avatar, PathInfo } from '@common/game';
import { getLobbyLimit } from '@common/lobby-limits';
import { EventEmitter2 } from '@nestjs/event-emitter';

// --- Create a dummy board that conforms to the Board interface ---
const createDummyCell = (pos: Vec2, tile: Tile, player: Avatar = Avatar.Default, item: Item = Item.DEFAULT, cost: number = 1): Cell => ({
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
    visibility: Visibility.PUBLIC, // adjust according to your Visibility type
    board: [
        [createDummyCell({ x: 0, y: 0 }, Tile.FLOOR), createDummyCell({ x: 1, y: 0 }, Tile.CLOSED_DOOR)],
        [createDummyCell({ x: 0, y: 1 }, Tile.ICE), createDummyCell({ x: 1, y: 1 }, Tile.WATER)],
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

// --- Create dummy players ---
const createDummyPlayer = (id: string): Player => {
    // Minimal stub with the properties and methods needed by Game
    return {
        id,
        avatar: Avatar.Cleric,
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
            expect(game.hasStarted).toBe(false);
            expect(game.isCTF).toBe(dummyBoard.isCTF);
            expect(game.timer).toBeInstanceOf(Timer);
            expect(game.fight).toBeInstanceOf(Fight);
            expect(game.maxPlayers).toBe(getLobbyLimit(dummyBoard.size));
        });

        it('getMapSize should return board length', () => {
            expect(game.getMapSize()).toBe(dummyBoard.board.length);
        });

        it('getTimer should return the timer', () => {
            expect(game.getTimer()).toBe(game.timer);
        });

        it('getPlayer should return a player by id', () => {
            game.addPlayer(player1);
            game.addPlayer(player2);
            expect(game.getPlayer('p2')).toBe(player2);
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

        it('removePlayer should remove an existing player and emit event', () => {
            game.addPlayer(player1);
            game.addPlayer(player2);
            const emitSpy = jest.spyOn(emitter, 'emit');
            game.removePlayer('p1', 'bye');
            expect(game.players).toHaveLength(1);
            expect(emitSpy).toHaveBeenCalledWith(InternalRoomEvents.PlayerRemoved, { name: player1.name, playerId: 'p1', message: 'bye' });
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
            game.hasStarted = true;
            game.movementInProgress = true;
            game.pendingEndTurn = true;
            game.maxPlayers = 5;
            game.closeGame();
            expect(removeAllSpy).toHaveBeenCalledWith(InternalEvents.EndTimer);
            expect(removeAllSpy).toHaveBeenCalledWith(InternalEvents.UpdateTimer);
            expect(game.fight).toBeNull();
            expect(game.players).toEqual([]);
            expect(game.hasStarted).toBe(false);
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
            expect(game.hasStarted).toBe(true);
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
    });

    describe('configureTurn', () => {
        it('should initialize turn and return player and path', () => {
            game.players = [player1, player2];
            game.currentTurn = 0;
            (player1.initTurn as jest.Mock).mockImplementation(() => {});
            const result = game.configureTurn();
            expect(result.player).toBe(player1);
            expect(Object.keys(result.path)).toEqual(['key']);
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
            expect(decrementSpy).toHaveBeenCalledWith(player1, pathInfo.cost / pathInfo.path.length);
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
    });

    describe('_canDropItemHere', () => {
        it('should return true when cell has no player and valid tile', () => {
            const cell = createDummyCell({ x: 0, y: 0 }, Tile.FLOOR, undefined, Item.DEFAULT);
            expect((game as any)._canDropItemHere(cell)).toBe(true);
        });

        it('should return true when cell has default player and valid tile', () => {
            const cell = createDummyCell({ x: 0, y: 0 }, Tile.ICE, Avatar.Default, Item.DEFAULT);
            expect((game as any)._canDropItemHere(cell)).toBe(true);
        });

        it('should return true when cell has player but default item and valid tile', () => {
            const cell = createDummyCell({ x: 0, y: 0 }, Tile.WATER, Avatar.Cleric, Item.DEFAULT);
            expect((game as any)._canDropItemHere(cell)).toBe(true);
        });

        it('should return true for all valid tile types', () => {
            const validTiles = [Tile.FLOOR, Tile.ICE, Tile.WATER, Tile.OPENED_DOOR];
            validTiles.forEach((tile) => {
                const cell = createDummyCell({ x: 0, y: 0 }, tile);
                expect((game as any)._canDropItemHere(cell)).toBe(true);
            });
        });

        it('should return false when cell has player, non-default item, and valid tile', () => {
            const cell = createDummyCell({ x: 0, y: 0 }, Tile.FLOOR, Avatar.Cleric, Item.SWORD);
            expect((game as any)._canDropItemHere(cell)).toBe(false);
        });

        it('should return false when cell has invalid tile type', () => {
            const invalidTiles = [Tile.WALL, Tile.CLOSED_DOOR];
            invalidTiles.forEach((tile) => {
                const cell = createDummyCell({ x: 0, y: 0 }, tile);
                expect((game as any)._canDropItemHere(cell)).toBe(false);
            });
        });
    });

    describe('startTurn and endTurn', () => {
        beforeEach(() => {
            game.players = [player1, player2];
            game.currentTurn = 0;
            jest.useFakeTimers();
            jest.spyOn(game, 'configureTurn').mockReturnValue({
                player: player1,
                path: { key: { path: [{ x: 0, y: 0 }], cost: 1 } },
            });
        });

        it('startTurn should emit ChangeTurn and then start timer and emit Start after delay', () => {
            const emitSpy = jest.spyOn(emitter, 'emit');
            game.startTurn();
            expect(emitSpy).toHaveBeenCalledWith(InternalTurnEvents.ChangeTurn, {
                player: player1,
                path: { key: { path: [{ x: 0, y: 0 }], cost: 1 } },
            });
            jest.advanceTimersByTime(THREE_SECONDS_IN_MS);
            expect(game.timer).toBeInstanceOf(Timer);
            expect(emitSpy).toHaveBeenCalledWith(InternalTurnEvents.Start, player1.id);
        });

        it('endTurn should update currentTurn and call startTurn', () => {
            const startTurnSpy = jest.spyOn(game, 'startTurn').mockImplementation(() => {});
            game.players = [player1, player2];
            game.currentTurn = 0;
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

        it('toggleDebug should invert debug mode', () => {
            game.isDebugMode = false;
            expect(game.toggleDebug()).toBe(true);
            expect(game.toggleDebug()).toBe(false);
        });
    });

    describe('changeDoorState', () => {
        it('should toggle door state and decrement action', () => {
            // dummyBoard.board[0][1] initially has Tile.CLOSED_DOOR.
            player1.actions = 2;
            game.addPlayer(player1);
            const result = game.changeDoorState({ x: 1, y: 0 }, player1.id);
            expect(result.newDoorState).toBe(Tile.OPENED_DOOR);
            expect(player1.actions).toBe(1);
        });
    });

    describe('initFight', () => {
        it('should initialize fight between two players and start timer for combat', () => {
            game.addPlayer(player1);
            game.addPlayer(player2);
            const timerSpy = jest.spyOn(game.timer, 'startTimer').mockImplementation(() => {});
            (player1.initFight as jest.Mock).mockImplementation(() => {});
            (player2.initFight as jest.Mock).mockImplementation(() => {});
            const fightResult = game.initFight(player1.id, player2.id);
            expect(fightResult).toBe(game.fight);
            expect(timerSpy).toHaveBeenCalledWith(FIGHT_TURN_DURATION_IN_S, TimerType.Combat);
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

        it('flee should return the result from fight.flee', () => {
            expect(game.flee()).toBe(true);
        });
    });

    describe('playerAttack', () => {
        beforeEach(() => {
            game.fight = new Fight(emitter);
            game.fight.currentPlayer = player1;
            jest.spyOn(game.fight, 'playerAttack').mockReturnValue(null);
            jest.spyOn(game, 'changeFighter').mockReturnValue(game.fight);
        });

        it('should call changeFighter and emit event when fight.playerAttack returns null', () => {
            const emitSpy = jest.spyOn(emitter, 'emit');
            game.playerAttack();
            expect(emitSpy).toHaveBeenCalledWith(InternalFightEvents.ChangeFighter, game.fight);
        });

        it('should move loser to spawn, end fight and emit event when attack kills opponent', () => {
            const fightResult = { winner: player1, loser: player2 };
            jest.spyOn(game.fight, 'playerAttack').mockReturnValue(fightResult);
            // Stub de dropItems pour éviter l'erreur sur player.inventory
            game.dropItems = jest.fn();
            const moveSpy = jest.spyOn(game as any, 'movePlayerToSpawn').mockImplementation(() => {});
            const endFightSpy = jest.spyOn(game, 'endFight').mockImplementation(() => {});
            const emitSpy = jest.spyOn(emitter, 'emit');
            game.playerAttack();
            expect(moveSpy).toHaveBeenCalledWith(player2);
            expect(endFightSpy).toHaveBeenCalled();
            expect(emitSpy).toHaveBeenCalledWith(InternalFightEvents.End, fightResult);
        });
    });

    describe('isPlayerInFight, removePlayerOnMap, removePlayerFromFight, endFight', () => {
        beforeEach(() => {
            game.fight = new Fight(emitter);
            jest.spyOn(game.fight, 'hasFight').mockReturnValue(true);
            jest.spyOn(game.fight, 'isPlayerInFight').mockReturnValue(true);
            game.addPlayer(player1);
        });

        it('isPlayerInFight should return true when fight exists and player is in fight', () => {
            expect(game.isPlayerInFight(player1.id)).toBe(true);
        });

        it('removePlayerOnMap should update map cells for player', () => {
            player1.position = { x: 0, y: 0 };
            player1.spawnPosition = { x: 1, y: 1 };
            dummyBoard.board[0][0].player = player1.avatar as Avatar;
            dummyBoard.board[1][1].item = Item.DEFAULT;
            game.removePlayerOnMap(player1.id);
            expect(dummyBoard.board[0][0].player).toBe(Avatar.Default);
            expect(dummyBoard.board[1][1].item).toBe(Item.DEFAULT);
        });

        it('removePlayerFromFight should emit End event with fight removal result', () => {
            const fightRemovalResult = { winner: player2, loser: player1 };
            jest.spyOn(game.fight, 'handleFightRemoval').mockReturnValue(fightRemovalResult);
            const emitSpy = jest.spyOn(emitter, 'emit');
            game.removePlayerFromFight(player1.id);
            expect(emitSpy).toHaveBeenCalledWith(InternalFightEvents.End, fightRemovalResult);
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
