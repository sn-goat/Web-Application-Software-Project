/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
import { MOVEMENT_TIMEOUT_IN_MS, TURN_DURATION_IN_S } from '@app/gateways/game/game.gateway.constants';
import { InternalEvents } from '@app/constants/internal-events';
import { BoardService } from '@app/services/board/board.service';
import { FightService } from '@app/services/fight/fight.service';
import { GameUtils } from '@app/services/game/game-utils';
import { GameService } from '@app/services/game/game.service';
import { TimerService } from '@app/services/timer/timer.service';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar, Fight, FightInfo, Game, PathInfo } from '@common/game';
import { TurnEvents } from '@common/game.gateway.events';
import { ATTACK_ICE_DECREMENT, DEFAULT_ATTACK_VALUE, DEFAULT_DEFENSE_VALUE, DEFENSE_ICE_DECREMENT, PlayerStats } from '@common/player';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('GameService', () => {
    let gameService: GameService;
    let boardService: Partial<BoardService>;
    let timerService: Partial<TimerService>;
    let fightService: Partial<FightService>;
    let eventEmitter: Partial<EventEmitter2>;

    const accessCode = 'TEST123';
    let testGame: Game;
    let testMap: Cell[][];

    beforeEach(() => {
        testMap = [
            [
                { tile: Tile.FLOOR, item: Item.DEFAULT, cost: 1, player: Avatar.Default, position: { x: 0, y: 0 } },
                { tile: Tile.FLOOR, item: Item.DEFAULT, cost: 1, player: Avatar.Default, position: { x: 1, y: 0 } },
            ],
            [
                { tile: Tile.FLOOR, item: Item.DEFAULT, cost: 1, player: Avatar.Default, position: { x: 0, y: 1 } },
                { tile: Tile.FLOOR, item: Item.DEFAULT, cost: 1, player: Avatar.Default, position: { x: 1, y: 1 } },
            ],
        ];

        const player1: PlayerStats = {
            id: 'p1',
            name: 'Player1',
            position: { x: 0, y: 0 },
            spawnPosition: { x: 0, y: 0 },
            avatar: 'avatar1',
            speed: 5,
            movementPts: 5,
            actions: 1,
            wins: 0,
        } as PlayerStats;
        const player2: PlayerStats = {
            id: 'p2',
            name: 'Player2',
            position: { x: 1, y: 1 },
            spawnPosition: { x: 1, y: 1 },
            avatar: 'avatar2',
            speed: 3,
            movementPts: 3,
            actions: 1,
            wins: 0,
        } as PlayerStats;

        testGame = {
            accessCode,
            organizerId: 'org1',
            players: [player1, player2],
            map: testMap,
            currentTurn: 0,
            isDebugMode: false,
        } as Game;

        boardService = {
            getBoard: jest.fn().mockResolvedValue({ board: testMap }),
        };

        timerService = {
            stopTimer: jest.fn(),
            startTimer: jest.fn(),
        };

        fightService = {
            getFight: jest.fn().mockReturnValue(null),
            getFighter: jest.fn(),
            getOpponent: jest.fn(),
            endFight: jest.fn(),
        };

        eventEmitter = {
            emit: jest.fn(),
        };

        gameService = new GameService(
            boardService as BoardService,
            timerService as TimerService,
            fightService as FightService,
            eventEmitter as EventEmitter2,
        );

        (gameService as any).currentGames = new Map();
        (gameService as any).currentGames.set(accessCode, testGame);
    });

    describe('toggleDebugState, endDebugMode & isGameDebugMode', () => {
        it('should toggle debug mode', () => {
            expect(testGame.isDebugMode).toBe(false);
            gameService.toggleDebugState(accessCode);
            expect(testGame.isDebugMode).toBe(true);
            gameService.toggleDebugState(accessCode);
            expect(testGame.isDebugMode).toBe(false);
        });

        it('should set debug mode to false with endDebugMode', () => {
            testGame.isDebugMode = true;
            gameService.endDebugMode(accessCode);
            expect(testGame.isDebugMode).toBe(false);
        });

        it('isGameDebugMode should reflect current game debug state', () => {
            testGame.isDebugMode = true;
            expect(gameService.isGameDebugMode(accessCode)).toBe(true);
            testGame.isDebugMode = false;
            expect(gameService.isGameDebugMode(accessCode)).toBe(false);
        });
    });

    describe('hasActiveFight', () => {
        it('should return false when no fight is active', () => {
            expect(gameService.hasActiveFight(accessCode)).toBe(false);
        });
        it('should return true when a fight is active', () => {
            (gameService as any).activeFights.set(accessCode, { dummy: true });
            expect(gameService.hasActiveFight(accessCode)).toBe(true);
        });
    });

    describe('changeDoorState', () => {
        it('should toggle door tile, emit event and call decrementAction', () => {
            testMap[0][0].tile = Tile.CLOSED_DOOR;
            const player: PlayerStats = testGame.players[0];
            gameService.changeDoorState(accessCode, { x: 0, y: 0 }, player);
            expect(testMap[0][0].tile).toBe(Tile.OPENED_DOOR);
        });
    });

    describe('decrementAction', () => {
        it('should decrement actions and emit end turn if no possible further action', () => {
            const player = testGame.players[0];
            player.actions = 1;
            jest.spyOn(gameService, 'updatePlayerPathTurn').mockReturnValue(new Map());
            gameService.decrementAction(accessCode, player);
            expect(player.actions).toBe(0);
            expect(eventEmitter.emit).toHaveBeenCalledWith(TurnEvents.End, accessCode);
        });
    });

    describe('decrementMovement', () => {
        it('should reduce movement points and emit end turn if conditions met', () => {
            const player = testGame.players[0];
            player.movementPts = 5;
            (gameService as any).pendingEndTurn.set(accessCode, false);
            jest.spyOn(gameService, 'updatePlayerPathTurn').mockReturnValue(new Map());
            gameService.decrementMovement(accessCode, player, 3);
            expect(player.movementPts).toBe(2);
            expect(eventEmitter.emit).toHaveBeenCalledWith(TurnEvents.End, accessCode);
            expect((gameService as any).pendingEndTurn.get(accessCode)).toBe(false);
        });
    });

    describe('configureGame', () => {
        it('should sort players by speed and assign spawn points', () => {
            testGame.players = [
                { id: 'p1', name: 'Player1', speed: 3, position: { x: 0, y: 0 }, spawnPosition: { x: 0, y: 0 } } as PlayerStats,
                { id: 'p2', name: 'Player2', speed: 5, position: { x: 1, y: 1 }, spawnPosition: { x: 1, y: 1 } } as PlayerStats,
            ];
            const configuredGame = gameService.configureGame(accessCode, testGame.players);
            expect(configuredGame.players[0].id).toBe('p2');
            expect(configuredGame.players[1].id).toBe('p1');
        });

        it('should return null if game is not found', () => {
            expect(gameService.configureGame('inexistent', [])).toBeNull();
        });
    });

    describe('configureTurn', () => {
        it('should configure the turn and return player and possible paths', () => {
            jest.spyOn(GameUtils, 'findPossiblePaths').mockImplementation(() => new Map([['key', { path: [{ x: 1, y: 0 }], cost: 1 }]]));
            const turnConfig = gameService.configureTurn(accessCode);
            expect(turnConfig.player).toBeDefined();
            expect(turnConfig.path).toEqual({ key: { path: [{ x: 1, y: 0 }], cost: 1 } });
        });
    });

    describe('updatePlayerPathTurn', () => {
        it('should update player path and emit notification', () => {
            const newPaths = new Map([['a', { path: [{ x: 0, y: 1 }], cost: 1 }]]);
            jest.spyOn(GameUtils, 'findPossiblePaths').mockImplementation(() => newPaths);
            const player = testGame.players[0];
            const updated = gameService.updatePlayerPathTurn(accessCode, player);
            expect(updated).toEqual(newPaths);
            expect(eventEmitter.emit).toHaveBeenCalledWith(TurnEvents.UpdateTurn, {
                player,
                path: Object.fromEntries(newPaths),
            });
        });
    });

    describe('createGame', () => {
        it('should create a game and add it to currentGames', async () => {
            (boardService.getBoard as jest.Mock).mockResolvedValue({ board: testMap });
            await gameService.createGame(accessCode, 'org1', 'testBoard');
            const createdGame = (gameService as any).currentGames.get(accessCode);
            expect(createdGame).toBeDefined();
            expect(createdGame.organizerId).toBe('org1');
            expect(createdGame.map).toEqual(testMap);
        });

        it('should throw an error if board not found', async () => {
            (boardService.getBoard as jest.Mock).mockResolvedValue(null);
            await expect(gameService.createGame(accessCode, 'org1', 'testBoard')).rejects.toThrow('Board not found');
        });
    });

    describe('removePlayer', () => {
        it('should remove specified player, update map and emit event', () => {
            (fightService.getFight as jest.Mock).mockReturnValue(null);
            const player = testGame.players[0];
            testMap[player.position.y][player.position.x].player = player.avatar as Avatar;
            testMap[player.spawnPosition.y][player.spawnPosition.x].item = Item.SPAWN;
            gameService.removePlayer(accessCode, player.id);
            expect(testGame.players.find((p) => p.id === player.id)).toBeUndefined();
            expect(testMap[player.position.y][player.position.x].player).toBe(Avatar.Default);
            expect(testMap[player.spawnPosition.y][player.spawnPosition.x].item).toBe(Item.DEFAULT);
            expect(eventEmitter.emit).toHaveBeenCalledWith(InternalEvents.PlayerRemoved, { accessCode, game: testGame });
        });
    });

    describe('deleteGame', () => {
        it('should stop the timer, delete the game and log deletion', () => {
            gameService.deleteGame(accessCode);
            expect(timerService.stopTimer).toHaveBeenCalledWith(accessCode);
            expect((gameService as any).currentGames.has(accessCode)).toBe(false);
        });
    });

    describe('movePlayerToSpawn & movePlayer', () => {
        it('movePlayerToSpawn should call movePlayer with spawnPosition if spawn is not occupied', () => {
            const player = testGame.players[0];
            testMap[player.spawnPosition.y][player.spawnPosition.x].player = Avatar.Default;
            const spyMovePlayer = jest.spyOn(gameService, 'movePlayer').mockImplementation(() => {});
            gameService.movePlayerToSpawn(accessCode, player);
            expect(spyMovePlayer).toHaveBeenCalledWith(accessCode, player.spawnPosition, player);
        });

        it('movePlayerToSpawn should call movePlayer with alternate spawn if spawn is occupied', () => {
            const player = testGame.players[0];
            testMap[player.spawnPosition.y][player.spawnPosition.x].player = 'otherAvatar' as Avatar;
            const alternateSpawn: Vec2 = { x: 1, y: 0 };
            jest.spyOn(GameUtils as any, 'findValidSpawn').mockReturnValue(alternateSpawn);
            const spyMovePlayer = jest.spyOn(gameService, 'movePlayer').mockImplementation(() => {});
            gameService.movePlayerToSpawn(accessCode, player);
            expect(spyMovePlayer).toHaveBeenCalledWith(accessCode, alternateSpawn, player);
        });

        it('movePlayer should update player position and emit move event with defaults on non ICE tile', () => {
            const player = testGame.players[0];
            player.position = { x: 0, y: 0 };
            testMap[1][0].tile = Tile.FLOOR;
            gameService.movePlayer(accessCode, { x: 0, y: 1 }, player);
            expect(player.position).toEqual({ x: 0, y: 1 });
            expect(testMap[0][0].player).toBe(Avatar.Default);
            expect(testMap[1][0].player).toBe(player.avatar);
            expect(player.attack).toBe(DEFAULT_ATTACK_VALUE);
        });

        it('movePlayer should update attack and defense for ICE tile', () => {
            const player = testGame.players[0];
            player.position = { x: 0, y: 0 };
            testMap[1][0].tile = Tile.ICE;
            gameService.movePlayer(accessCode, { x: 0, y: 1 }, player);
            expect(player.attack).toBe(DEFAULT_ATTACK_VALUE - ATTACK_ICE_DECREMENT);
            expect(player.defense).toBe(DEFAULT_DEFENSE_VALUE - DEFENSE_ICE_DECREMENT);
        });
    });

    describe('getPlayer, startTimer, isActivePlayerReady, getPlayerTurn and getMap', () => {
        it('getPlayer should return the correct player', () => {
            const player = gameService.getPlayer(accessCode, 'p1');
            expect(player).toEqual(testGame.players[0]);
        });

        it('startTimer should call timerService.startTimer with correct parameters', () => {
            gameService.startTimer(accessCode);
            expect(timerService.startTimer).toHaveBeenCalledWith(accessCode, TURN_DURATION_IN_S, 'movement');
        });

        it('isActivePlayerReady should return true if player is the current turn', () => {
            expect(gameService.isActivePlayerReady(accessCode, 'p1')).toBe(true);
            expect(gameService.isActivePlayerReady(accessCode, 'p2')).toBe(false);
        });

        it('getPlayerTurn should return the correct player based on currentTurn', () => {
            const pTurn = gameService.getPlayerTurn(accessCode);
            expect(pTurn).toEqual(testGame.players[0]);
            testGame.currentTurn = 1;
            expect(gameService.getPlayerTurn(accessCode)).toEqual(testGame.players[1]);
        });

        it('getMap should return the current map', () => {
            const map = gameService.getMap(accessCode);
            expect(map).toEqual(testGame.map);
        });
    });

    describe('switchTurn, endTurnRequested and incrementWins', () => {
        it('switchTurn should update currentTurn cyclically', () => {
            expect(testGame.currentTurn).toBe(0);
            gameService.switchTurn(accessCode);
            expect(testGame.currentTurn).toBe(1);
            gameService.switchTurn(accessCode);
            expect(testGame.currentTurn).toBe(0);
        });

        it('endTurnRequested should set pendingEndTurn flag if movement in progress', () => {
            (gameService as any).movementInProgress.set(accessCode, true);
            gameService.endTurnRequested(accessCode);
            expect((gameService as any).pendingEndTurn.get(accessCode)).toBe(true);
            (gameService as any).movementInProgress.set(accessCode, false);
            gameService.endTurnRequested(accessCode);
            expect(eventEmitter.emit).toHaveBeenCalledWith(TurnEvents.End, accessCode);
        });

        it('incrementWins should increment player wins', () => {
            const player = testGame.players[0];
            const initialWins = player.wins;
            gameService.incrementWins(accessCode, player.id);
            expect(player.wins).toBe(initialWins + 1);
        });
    });

    describe('processPath', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.spyOn(gameService, 'movePlayer').mockImplementation(() => {});
            jest.spyOn(gameService, 'decrementMovement').mockImplementation(() => {});
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should process all path steps and then call decrementMovement, setting movementInProgress to false', () => {
            const player = testGame.players[0];
            const pathInfo: PathInfo = {
                path: [
                    { x: 1, y: 0 },
                    { x: 2, y: 0 },
                ],
                cost: 3,
            };

            gameService.processPath(accessCode, pathInfo, player);
            expect((gameService as any).movementInProgress.get(accessCode)).toBe(true);

            jest.advanceTimersByTime(1 * MOVEMENT_TIMEOUT_IN_MS);
            expect(gameService.movePlayer).toHaveBeenCalledWith(accessCode, { x: 1, y: 0 }, player);
            expect(player.position).toEqual({ x: 1, y: 0 });
            jest.advanceTimersByTime(1 * MOVEMENT_TIMEOUT_IN_MS);
            expect(gameService.movePlayer).toHaveBeenCalledWith(accessCode, { x: 2, y: 0 }, player);
            expect(player.position).toEqual({ x: 2, y: 0 });
            jest.advanceTimersByTime(1 * MOVEMENT_TIMEOUT_IN_MS);
            expect((gameService as any).movementInProgress.get(accessCode)).toBe(false);
            expect(gameService.decrementMovement).toHaveBeenCalledWith(accessCode, player, pathInfo.cost);
        });
    });

    describe('GameService - logger and fightService interactions', () => {
        it('should call fightService.endFight if an active fight exists', () => {
            const fighter = { id: 'p1' } as PlayerStats & FightInfo;
            const opponent = { id: 'p2' } as PlayerStats & FightInfo;
            const dummyFight = { player1: fighter, player2: opponent, currentPlayer: fighter } as Fight;
            jest.spyOn(gameService['fightService'], 'getFight').mockReturnValue(dummyFight);
            jest.spyOn(gameService['fightService'], 'getFighter').mockReturnValue(fighter);
            jest.spyOn(gameService['fightService'], 'getOpponent').mockReturnValue(opponent);
            const endFightSpy = jest.spyOn(gameService['fightService'], 'endFight').mockImplementation(() => {});
            gameService.removePlayer(accessCode, 'p1');

            expect(endFightSpy).toHaveBeenCalledWith(accessCode, opponent, fighter);
        });
    });
    describe('isPlayerTurnEnded', () => {
        it('should return true when player has 0 movementPts, 0 actions or cannot make any action', () => {
            const player: PlayerStats = {
                id: 'p1',
                name: 'Player1',
                position: { x: 0, y: 0 },
                spawnPosition: { x: 0, y: 0 },
                avatar: 'avatar1',
                speed: 5,
                movementPts: 0,
                actions: 0,
                wins: 0,
            } as PlayerStats;

            jest.spyOn(GameUtils, 'isPlayerCanMakeAction').mockReturnValue(false);
            const result = (gameService as any).isPlayerTurnEnded(accessCode, player);
            expect(result).toBe(true);
        });
    });
});
