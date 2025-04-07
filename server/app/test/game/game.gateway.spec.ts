/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Fight } from '@app/class/fight';
import { Game } from '@app/class/game';
import { Player } from '@app/class/player';
import { GameGateway } from '@app/gateways/game/game.gateway';
import { GameManagerService } from '@app/services/game/games-manager.service';
import { JournalService } from '@app/services/journal/journal.service';
import { Vec2 } from '@common/board';
import { Tile } from '@common/enums';
import { PathInfo } from '@common/game';
import { FightEvents, GameEvents, TurnEvents } from '@common/game.gateway.events';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BroadcastOperator, Server, Socket } from 'socket.io';

describe('GameGateway', () => {
    let gateway: GameGateway;
    let server: jest.Mocked<Server>;
    let journalService: jest.Mocked<JournalService>;
    let gameManager: jest.Mocked<GameManagerService>;
    let emitMock: jest.Mock;
    let broadcastOperator: Partial<BroadcastOperator<any, any>>;
    let client: jest.Mocked<Socket>;

    beforeEach(async () => {
        emitMock = jest.fn();

        broadcastOperator = {
            emit: emitMock,
            to: jest.fn().mockReturnThis(),
            except: jest.fn().mockReturnThis(),
            timeout: jest.fn().mockReturnThis(),
        };

        server = {
            to: jest.fn().mockReturnValue(broadcastOperator),
        } as unknown as jest.Mocked<Server>;

        client = {
            emit: jest.fn(),
            join: jest.fn(),
            leave: jest.fn(),
            id: 'client-id',
        } as unknown as jest.Mocked<Socket>;

        gameManager = {
            getGame: jest.fn(),
            getFight: jest.fn(),
            closeRoom: jest.fn(),
            getRoom: jest.fn(),
        } as unknown as jest.Mocked<GameManagerService>;

        journalService = {
            dispatchEntry: jest.fn(),
        } as unknown as jest.Mocked<JournalService>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameGateway,
                { provide: GameManagerService, useValue: gameManager },
                { provide: Logger, useValue: new Logger() },
                { provide: JournalService, useValue: journalService },
            ],
        }).compile();

        gateway = module.get<GameGateway>(GameGateway);
        gateway['server'] = server as any;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('Event Handlers', () => {
        it('handleFightTimerUpdate should emit timer to both players', () => {
            const payload = { accessCode: '123', remainingTime: 15 };
            const fight1 = { player1: { id: 'p1' }, player2: { id: 'p2' } } as Fight;
            gameManager.getFight.mockReturnValue(fight1);

            gateway.handleFightTimerUpdate(payload);

            expect(server.to).toHaveBeenCalledWith(['p1', 'p2']);
            expect(emitMock).toHaveBeenCalledWith(FightEvents.UpdateTimer, payload.remainingTime);
        });

        it('handleTurnTimerUpdate should emit timer update to room', () => {
            const payload = { accessCode: 'room123', remainingTime: 30 };

            gateway.handleTurnTimerUpdate(payload);

            expect(server.to).toHaveBeenCalledWith(payload.accessCode);
            expect(emitMock).toHaveBeenCalledWith(TurnEvents.UpdateTimer, payload.remainingTime);
        });

        it('handleBroadcastMove should emit PlayerMoved event', () => {
            const player = { name: 'Alice' } as Player;
            const position: Vec2 = { x: 1, y: 2 };

            gateway.handleBroadcastMove({ accessCode: 'ABC', previousPosition: position, player });

            expect(server.to).toHaveBeenCalledWith('ABC');
            expect(emitMock).toHaveBeenCalledWith(TurnEvents.PlayerMoved, { previousPosition: position, player });
        });

        it('handleDebugStateChange should emit DebugStateChanged event', () => {
            const payload = { accessCode: 'code123', newState: true };

            gateway.handleDebugStateChange(payload);

            expect(server.to).toHaveBeenCalledWith('code123');
            expect(emitMock).toHaveBeenCalledWith(GameEvents.DebugStateChanged, payload.newState);
        });

        it('handleUpdateTurn should emit UpdateTurn event to specific player', () => {
            const player = { id: 'player456', name: 'Bob' } as Player;
            const path = { '0,0': { cost: 1, path: [] } } as Record<string, PathInfo>;

            gateway.handleUpdateTurn({ player, path });

            expect(server.to).toHaveBeenCalledWith(player.id);
            expect(emitMock).toHaveBeenCalledWith(TurnEvents.UpdateTurn, { player, path });
        });

        it('handleEndTurn should emit PlayerTurn event to room', () => {
            const player = { id: 'player789', name: 'Charlie' } as Player;
            const path = { '1,1': { cost: 2, path: [] } } as Record<string, PathInfo>;
            const accessCode = 'game456';

            gateway.handleEndTurn({ accessCode, player, path });

            expect(server.to).toHaveBeenCalledWith(accessCode);
            expect(emitMock).toHaveBeenCalledWith(TurnEvents.PlayerTurn, { player, path });
        });

        it('changeFighter should emit ChangeFighter event to both players', () => {
            const fight1 = {
                player1: { id: 'p1', getDamage: () => 5 },
                player2: { id: 'p2', getDamage: () => 5 },
                currentPlayer: { name: 'Player 1' },
            } as Fight;

            gateway.changeFighter({ accessCode: '1234', fight: fight1 });

            expect(server.to).toHaveBeenCalledWith('p1');
            expect(server.to).toHaveBeenCalledWith('p2');
            expect(emitMock).toHaveBeenCalledWith(FightEvents.ChangeFighter, fight1);
        });

        it('manageEndFight should emit appropriate events based on win state', () => {
            // Setup
            const winner = { id: 'w1', wins: 3, getDamage: () => 5 } as Player;
            const loser = { id: 'l1', getDamage: () => 5 } as Player;
            const accessCode = 'fight123';
            const players = [winner, loser];

            const game = {
                players,
                isPlayerTurn: jest.fn().mockReturnValue(true),
                endTurn: jest.fn(),
                timer: { resumeTimer: jest.fn() },
                decrementAction: jest.fn(),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            // Test execution
            gateway.manageEndFight({ accessCode, winner, loser });

            // Assertions
            expect(server.to).toHaveBeenCalledWith(winner.id);
            expect(emitMock).toHaveBeenCalledWith(FightEvents.Winner, winner);

            expect(server.to).toHaveBeenCalledWith(loser.id);
            expect(emitMock).toHaveBeenCalledWith(FightEvents.Loser, loser);

            expect(server.to).toHaveBeenCalledWith(accessCode);
            expect(emitMock).toHaveBeenCalledWith(FightEvents.End, players);

            // Winner has enough wins
            expect(server.to).toHaveBeenCalledWith(accessCode);
            expect(emitMock).toHaveBeenCalledWith(GameEvents.GameEnded, winner);
            expect(gameManager.closeRoom).toHaveBeenCalledWith(accessCode);
        });

        it('manageEndFight should end turn when loser is current player', () => {
            // Setup
            const winner = { id: 'w1', wins: 1, getDamage: () => 5 } as Player; // Not enough wins yet
            const loser = { id: 'l1', getDamage: () => 5 } as Player;
            const accessCode = 'fight123';
            const players = [winner, loser];

            const game = {
                players,
                isPlayerTurn: jest.fn().mockReturnValue(true), // Loser is current player
                endTurn: jest.fn(),
                timer: { resumeTimer: jest.fn() },
                decrementAction: jest.fn(),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            // Test execution
            gateway.manageEndFight({ accessCode, winner, loser });

            // Assertions for basic events
            expect(emitMock).toHaveBeenCalledWith(FightEvents.Winner, winner);
            expect(emitMock).toHaveBeenCalledWith(FightEvents.Loser, loser);
            expect(emitMock).toHaveBeenCalledWith(FightEvents.End, players);

            // Should not end game
            expect(gameManager.closeRoom).not.toHaveBeenCalled();

            // Should end turn since loser was current player
            expect(game.endTurn).toHaveBeenCalled();
            expect(game.timer.resumeTimer).not.toHaveBeenCalled();
            expect(game.decrementAction).not.toHaveBeenCalled();
        });

        it('manageEndFight should resume timer and decrement action when winner continues', () => {
            // Setup
            const winner = { id: 'w1', wins: 1, getDamage: () => 5 } as Player;
            const loser = { id: 'l1', getDamage: () => 5 } as Player;
            const accessCode = 'fight123';
            const players = [winner, loser];

            const game = {
                players,
                isPlayerTurn: jest.fn().mockReturnValue(false), // Loser is NOT current player
                endTurn: jest.fn(),
                timer: { resumeTimer: jest.fn() },
                decrementAction: jest.fn(),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            // Test execution
            gateway.manageEndFight({ accessCode, winner, loser });

            // Assertions
            expect(gameManager.closeRoom).not.toHaveBeenCalled();
            expect(game.endTurn).not.toHaveBeenCalled();

            // Should resume timer and decrement winner's action
            expect(game.timer.resumeTimer).toHaveBeenCalled();
            expect(game.decrementAction).toHaveBeenCalledWith(winner);
        });

        it('handleStartTurn should emit Turn Start event', () => {
            gateway.handleStartTurn('player123');

            expect(server.to).toHaveBeenCalledWith('player123');
            expect(emitMock).toHaveBeenCalledWith(TurnEvents.Start, {});
        });
    });

    describe('Socket Message Handlers', () => {
        it('handleGameStart should start game when valid', () => {
            const accessCode = 'valid123';
            const game = {
                configureGame: jest.fn().mockReturnThis(),
                startTurn: jest.fn(),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            gateway.handleGameStart(client, accessCode);

            expect(gameManager.getGame).toHaveBeenCalledWith(accessCode);
            expect(game.configureGame).toHaveBeenCalled();
            expect(server.to).toHaveBeenCalledWith(accessCode);
            expect(emitMock).toHaveBeenCalledWith(GameEvents.GameStarted, game);
            // expect(game.startTurn).toHaveBeenCalled();
        });

        it('handleGameStart should handle missing game', () => {
            const accessCode = 'invalid123';
            const errorSpy = jest.spyOn(Logger.prototype, 'error');

            gameManager.getGame.mockReturnValue(null);

            gateway.handleGameStart(client, accessCode);

            expect(gameManager.getGame).toHaveBeenCalledWith(accessCode);
            expect(errorSpy).toHaveBeenCalled();
            expect(server.to).not.toHaveBeenCalled();
        });

        it('handleGameStart should handle invalid game configuration', () => {
            const errorSpy = jest.spyOn(Logger.prototype, 'error');
            const accessCode = 'odd123';
            const game = {
                configureGame: jest.fn().mockReturnValue(null),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            gateway.handleGameStart(client, accessCode);

            expect(game.configureGame).toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalled();
            expect(client.emit).toHaveBeenCalledWith(GameEvents.Error, 'Il vous faut un nombre de joueurs pair pour commencer la partie.');
        });

        it('handleReady should start turn when player is current', () => {
            const accessCode = 'ready123';
            const playerId = 'player123';

            const game = {
                isPlayerTurn: jest.fn().mockReturnValue(true),
                startTurn: jest.fn(),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            gateway.handleReady(client, { accessCode, playerId });

            expect(gameManager.getGame).toHaveBeenCalledWith(accessCode);
            expect(game.isPlayerTurn).toHaveBeenCalledWith(playerId);
            expect(game.startTurn).toHaveBeenCalled();
        });

        it('handleReady should not start turn when player is not current', () => {
            const accessCode = 'ready123';
            const playerId = 'player456';

            const game = {
                isPlayerTurn: jest.fn().mockReturnValue(false),
                startTurn: jest.fn(),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            gateway.handleReady(client, { accessCode, playerId });

            expect(game.isPlayerTurn).toHaveBeenCalledWith(playerId);
            expect(game.startTurn).not.toHaveBeenCalled();
        });

        it('handleDebug should toggle debug mode', () => {
            const accessCode = 'game123';

            const game = {
                toggleDebug: jest.fn().mockReturnValue(true),
                isDebugMode: true,
                getPlayer: jest.fn().mockReturnValue([{ name: 'player123' }] as Player[]),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            gameManager.getRoom.mockReturnValue({ game } as any);
            gateway.handleDebug(client, accessCode);

            expect(gameManager.getGame).toHaveBeenCalledWith(accessCode);
            expect(game.toggleDebug).toHaveBeenCalled();
            expect(server.to).toHaveBeenCalledWith(accessCode);
            expect(emitMock).toHaveBeenCalledWith(GameEvents.DebugStateChanged, true);
        });

        it('handlePlayerMovement should process path', () => {
            const accessCode = 'game123';
            const playerId = 'player123';
            const path = { cost: 1, path: [] } as PathInfo;

            const game = {
                processPath: jest.fn(),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            gateway.handlePlayerMovement(client, { accessCode, path, playerId });

            expect(gameManager.getGame).toHaveBeenCalledWith(accessCode);
            expect(game.processPath).toHaveBeenCalledWith(path, playerId);
        });

        it('debugPlayerMovement should move player when in debug mode', () => {
            const accessCode = 'game123';
            const playerId = 'player123';
            const direction = { x: 1, y: 0 } as Vec2;

            const game = {
                isDebugMode: true,
                movePlayerDebug: jest.fn(),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            gateway.debugPlayerMovement(client, { accessCode, direction, playerId });

            expect(game.movePlayerDebug).toHaveBeenCalledWith(direction, playerId);
        });

        it('debugPlayerMovement should not move player when not in debug mode', () => {
            const accessCode = 'game123';
            const playerId = 'player123';
            const direction = { x: 1, y: 0 } as Vec2;

            const game = {
                isDebugMode: false,
                movePlayerDebug: jest.fn(),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            gateway.debugPlayerMovement(client, { accessCode, direction, playerId });

            expect(game.movePlayerDebug).not.toHaveBeenCalled();
        });

        it('handleChangeDoorState should change door state and broadcast', () => {
            const accessCode = 'game123';
            const playerId = 'player123';
            const doorPosition = { x: 5, y: 5 } as Vec2;
            const sendingInfo = {
                doorPosition,
                newDoorState: Tile.OPENED_DOOR,
            };

            const game = {
                changeDoorState: jest.fn().mockReturnValue(sendingInfo),
                players: [{ id: playerId, name: 'Player 1' } as Player, { id: 'player2', name: 'Player 2' } as Player],
                currentTurn: 0,
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);
            gameManager.getRoom.mockReturnValue({ game } as any);

            gateway.handleChangeDoorState(client, { accessCode, doorPosition, playerId });

            expect(game.changeDoorState).toHaveBeenCalledWith(doorPosition, playerId);
            expect(server.to).toHaveBeenCalledWith(accessCode);
            expect(emitMock).toHaveBeenCalledWith(TurnEvents.DoorStateChanged, {
                doorPosition: sendingInfo.doorPosition,
                newDoorState: sendingInfo.newDoorState,
            });
        });

        it('handlePlayerEnd should end turn', () => {
            const accessCode = 'game123';

            const game = {
                endTurn: jest.fn(),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            gateway.handlePlayerEnd(client, accessCode);

            expect(gameManager.getGame).toHaveBeenCalledWith(accessCode);
            expect(game.endTurn).toHaveBeenCalled();
        });

        it('handleFightInit should initialize fight and notify players', () => {
            const accessCode = 'game123';
            const playerInitiatorId = 'player1';
            const playerDefenderId = 'player2';

            const fight = {
                player1: { id: 'player1' },
                player2: { id: 'player2' },
            } as Fight;

            const game = {
                initFight: jest.fn().mockReturnValue(fight),
                getPlayer: jest.fn().mockReturnValue({ name: playerInitiatorId } as Player),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            gateway.handleFightInit(client, { accessCode, playerInitiatorId, playerDefenderId });

            expect(game.initFight).toHaveBeenCalledWith(playerInitiatorId, playerDefenderId);
            expect(server.to).toHaveBeenCalledWith([fight.player1.id, fight.player2.id]);
            expect(emitMock).toHaveBeenCalledWith(FightEvents.Init, fight);
        });

        it('handlePlayerFlee should end fight when flee successful', () => {
            const accessCode = 'game123';

            const game = {
                flee: jest.fn().mockReturnValue(true),
                fight: {
                    currentPlayer: { id: 'p1' },
                    player1: { id: 'p1' },
                    player2: { id: 'p2' },
                },
                endFight: jest.fn(),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            gateway.handlePlayerFlee(client, accessCode);

            expect(game.flee).toHaveBeenCalled();
            expect(server.to).toHaveBeenCalledWith(['p1', 'p2']);
            expect(emitMock).toHaveBeenCalledWith(FightEvents.End, null);
            expect(game.endFight).toHaveBeenCalled();
        });

        it('handlePlayerFlee should change fighter when flee unsuccessful', () => {
            const accessCode = 'game123';

            const fight = {
                currentPlayer: { id: 'p1' },
                player1: { id: 'p1' },
                player2: { id: 'p2' },
            } as Fight;

            const game = {
                flee: jest.fn().mockReturnValue(false),
                changeFighter: jest.fn().mockReturnValue(fight),
                fight,
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            gateway.handlePlayerFlee(client, accessCode);

            expect(game.flee).toHaveBeenCalled();
            expect(game.changeFighter).toHaveBeenCalled();
            expect(server.to).toHaveBeenCalledWith(['p1', 'p2']);
            expect(emitMock).toHaveBeenCalledWith(FightEvents.ChangeFighter, fight);
        });

        it('handlePlayerAttack should process attack', () => {
            const accessCode = 'game123';

            const game = {
                playerAttack: jest.fn(),
            } as unknown as Game;

            gameManager.getGame.mockReturnValue(game as any);

            gateway.handlePlayerAttack(client, accessCode);

            expect(gameManager.getGame).toHaveBeenCalledWith(accessCode);
            expect(game.playerAttack).toHaveBeenCalled();
        });
    });
});
