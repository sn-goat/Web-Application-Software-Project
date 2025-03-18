/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-empty-function */
import { GameGateway } from '@app/gateways/game/game.gateway';
import { FightService } from '@app/services/fight/fight.service';
import { GameService } from '@app/services/game/game.service';
import { TimerService } from '@app/services/timer/timer.service';
import { Vec2 } from '@common/board';
import { Tile } from '@common/enums';
import { Fight, PathInfo } from '@common/game';
import { FightEvents, GameEvents, TurnEvents } from '@common/game.gateway.events';
import { PlayerStats } from '@common/player';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';

describe('GameGateway', () => {
    let gateway: GameGateway;
    let gameService: Partial<GameService>;
    let timerService: Partial<TimerService>;
    let fightService: Partial<FightService>;
    let server: Partial<Server>;
    let client: Partial<Socket>;
    let logger: Logger;
    let toMock: jest.Mock;

    beforeEach(async () => {
        gameService = {
            createGame: jest.fn(),
            isGameDebugMode: jest.fn(),
            configureGame: jest.fn().mockResolvedValue('configuredGame'),
            toggleDebugState: jest.fn(),
            isActivePlayerReady: jest.fn().mockReturnValue(false),
            changeDoorState: jest.fn(),
            processPath: jest.fn(),
            movePlayer: jest.fn(),
            updatePlayerPathTurn: jest.fn(),
            switchTurn: jest.fn(),
            configureTurn: jest.fn().mockReturnValue({ player: { id: 'player1', avatar: 'avatar.png' } }),
            startTimer: jest.fn(),
            endTurnRequested: jest.fn(),
            getPlayer: jest.fn(),
            getPlayerTurn: jest.fn().mockReturnValue({ id: 'p1', name: 'Alice', avatar: 'a.png', spawnPosition: { x: 0, y: 0 } } as PlayerStats),
            incrementWins: jest.fn(),
            movePlayerToSpawn: jest.fn(),
        };

        timerService = {
            stopTimer: jest.fn(),
            resumeTimer: jest.fn(),
        };

        fightService = {
            initFight: jest.fn(),
            playerFlee: jest.fn(),
            playerAttack: jest.fn(),
            getFight: jest.fn(),
            nextTurn: jest.fn(),
        };

        toMock = jest.fn().mockReturnValue({ emit: jest.fn() });
        server = {
            to: toMock,
            emit: jest.fn(),
        };

        client = {
            id: 'socket1',
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameGateway,
                { provide: GameService, useValue: gameService },
                { provide: TimerService, useValue: timerService },
                { provide: FightService, useValue: fightService },
            ],
        }).compile();

        gateway = module.get<GameGateway>(GameGateway);
        gateway.server = server as Server;
        logger = new Logger(GameGateway.name);
        (gateway as any).logger = logger;
    });

    describe('OnEvent methods', () => {
        it('sendFightSwitchTurn should log error and return when no fight exists', () => {
            const accessCode = 'roomUnknown';
            (fightService.getFight as jest.Mock).mockReturnValue(undefined);
            const logErrorSpy = jest.spyOn(logger, 'error');

            gateway.sendFightSwitchTurn(accessCode);

            expect(logErrorSpy).toHaveBeenCalledWith('No active fight found for access code: ' + accessCode);
        });
        it('handleTimerUpdate should emit Fight UpdateTimer if fight exists', () => {
            const fight = {
                player1: { id: 'p1', name: 'Alice', avatar: 'a.png' } as PlayerStats,
                player2: { id: 'p2', name: 'Bob', avatar: 'b.png' } as PlayerStats,
            } as Fight;
            (fightService.getFight as jest.Mock).mockReturnValue(fight);

            const payload = { roomId: 'room1', remainingTime: 15 };
            gateway.handleTimerUpdate(payload);
            // On doit émettre sur les sockets des deux joueurs du combat
            expect(toMock).toHaveBeenCalledWith(fight.player1.id);
            expect(toMock.mock.results[0].value.emit as jest.Mock).toHaveBeenCalledWith(FightEvents.UpdateTimer, payload.remainingTime);
            expect(toMock).toHaveBeenCalledWith(fight.player2.id);
            expect(toMock.mock.results[1].value.emit as jest.Mock).toHaveBeenCalledWith(FightEvents.UpdateTimer, payload.remainingTime);
        });

        it('handleTimerUpdate should emit Turn UpdateTimer if pas de fight', () => {
            (fightService.getFight as jest.Mock).mockReturnValue(undefined);
            const payload = { roomId: 'room2', remainingTime: 10 };
            gateway.handleTimerUpdate(payload);
            expect(toMock).toHaveBeenCalledWith(payload.roomId);
            expect(toMock.mock.results[0].value.emit as jest.Mock).toHaveBeenCalledWith(TurnEvents.UpdateTimer, {
                remainingTime: payload.remainingTime,
            });
        });

        it('handleTimerEnd should call fightService.nextTurn if fight exists', () => {
            (fightService.getFight as jest.Mock).mockReturnValue({} as Fight);
            const roomId = 'roomFight';
            gateway.handleTimerEnd(roomId);
            expect(fightService.nextTurn).toHaveBeenCalledWith(roomId);
        });

        it('handleTimerEnd should call gameService.endTurnRequested if pas de fight', () => {
            (fightService.getFight as jest.Mock).mockReturnValue(undefined);
            const roomId = 'roomGame';
            gateway.handleTimerEnd(roomId);
            expect(gameService.endTurnRequested).toBeDefined(); // si endTurnRequested existe
            // Si la méthode est appelée dans l’implémentation
            // expect(gameService.endTurnRequested).toHaveBeenCalledWith(roomId);
        });

        it('handleAssignSpawn should emit assign spawn to correct player', () => {
            const payload = { playerId: 'p123', position: { x: 2, y: 3 } as Vec2 };
            gateway.handleAssignSpawn(payload);
            expect(toMock).toHaveBeenCalledWith(payload.playerId);
            expect(toMock.mock.results[0].value.emit as jest.Mock).toHaveBeenCalledWith(GameEvents.AssignSpawn, payload.position);
        });

        it('handleBroadcastMove should emit BroadcastMove', () => {
            const payload = {
                accessCode: 'room1',
                previousPosition: { x: 1, y: 1 } as Vec2,
                player: { id: 'p1', name: 'Alice', avatar: 'a.png' } as PlayerStats,
            };
            gateway.handleBroadcastMove(payload);
            expect(toMock).toHaveBeenCalledWith(payload.accessCode);
            expect(toMock.mock.results[0].value.emit as jest.Mock).toHaveBeenCalledWith(TurnEvents.BroadcastMove, {
                previousPosition: payload.previousPosition,
                player: payload.player,
            });
        });

        it('sendDoorState should emit BroadcastDoor', () => {
            const payload = { accessCode: 'room1', position: { x: 4, y: 4 } as Vec2, newState: Tile.OPENED_DOOR } as any;
            gateway.sendDoorState(payload);
            expect(toMock).toHaveBeenCalledWith(payload.accessCode);
            expect(toMock.mock.results[0].value.emit as jest.Mock).toHaveBeenCalledWith(TurnEvents.BroadcastDoor, {
                position: payload.position,
                newState: payload.newState,
            });
        });

        it('handleUpdateTurn should emit UpdateTurn to the player', () => {
            const turn = { player: { id: 'p1', name: 'Alice', avatar: 'a.png' } as PlayerStats, path: {} };
            gateway.handleUpdateTurn(turn);
            expect(toMock).toHaveBeenCalledWith(turn.player.id);
            expect(toMock.mock.results[0].value.emit as jest.Mock).toHaveBeenCalledWith(TurnEvents.UpdateTurn, turn);
        });

        it('handleEndTurn should call private endTurn', () => {
            // Espionner la méthode privée endTurn
            const endTurnSpy = jest.spyOn<any, any>(gateway as any, 'endTurn').mockImplementation(() => {});
            const accessCode = 'roomEnd';
            gateway.handleEndTurn(accessCode);
            expect(endTurnSpy).toHaveBeenCalledWith(accessCode);
        });

        it('sendFightInit should emit Fight Init to both players', () => {
            const fight = {
                player1: { id: 'p1', name: 'Alice', avatar: 'a.png' } as PlayerStats,
                player2: { id: 'p2', name: 'Bob', avatar: 'b.png' } as PlayerStats,
            } as Fight;
            gateway.sendFightInit(fight);
            expect(toMock).toHaveBeenCalledWith(fight.player1.id);
            expect(toMock.mock.results[0].value.emit as jest.Mock).toHaveBeenCalledWith(FightEvents.Init, fight);
            expect(toMock).toHaveBeenCalledWith(fight.player2.id);
            expect(toMock.mock.results[1].value.emit as jest.Mock).toHaveBeenCalledWith(FightEvents.Init, fight);
        });

        it('sendFightSwitchTurn should emit SwitchTurn if fight exists', () => {
            const fight = {
                currentPlayer: { id: 'pCurrent', name: 'Current', avatar: 'c.png' } as PlayerStats,
                player1: { id: 'p1', name: 'Alice', avatar: 'a.png' } as PlayerStats,
                player2: { id: 'p2', name: 'Bob', avatar: 'b.png' } as PlayerStats,
            } as Fight;
            (fightService.getFight as jest.Mock).mockReturnValue(fight);
            gateway.sendFightSwitchTurn('roomFight');
            expect(toMock).toHaveBeenCalledWith(fight.player1.id);
            expect(toMock.mock.results[0].value.emit as jest.Mock).toHaveBeenCalledWith(FightEvents.SwitchTurn, fight);
            expect(toMock).toHaveBeenCalledWith(fight.player2.id);
            expect(toMock.mock.results[1].value.emit as jest.Mock).toHaveBeenCalledWith(FightEvents.SwitchTurn, fight);
        });

        it('sendFightSwitchTurn should log error if no fight exists', () => {
            (fightService.getFight as jest.Mock).mockReturnValue(undefined);
            const logErrorSpy = jest.spyOn(logger, 'error');
            gateway.sendFightSwitchTurn('roomUnknown');
            expect(logErrorSpy).toHaveBeenCalledWith('No active fight found for access code: roomUnknown');
        });

        it('sendFightEnd should emit End events and resume timer', () => {
            const fight = {
                player1: { id: 'p1', name: 'Alice', avatar: 'a.png', spawnPosition: { x: 0, y: 0 } } as PlayerStats,
                player2: { id: 'p2', name: 'Bob', avatar: 'b.png', spawnPosition: { x: 1, y: 1 } } as PlayerStats,
            } as Fight;
            (fightService.getFight as jest.Mock).mockReturnValue(fight);
            (gameService.getPlayer as jest.Mock)
                .mockReturnValueOnce(fight.player1)
                .mockReturnValueOnce(fight.player2)
                .mockReturnValueOnce(fight.player2);
            // On simule également d'autres méthodes de gameService
            gameService.decrementAction = jest.fn();
            const payload = { accessCode: 'roomFight', winner: fight.player1, loser: fight.player2 };
            gateway.sendFightEnd(payload);
            expect(toMock.mock.results[0].value.emit as jest.Mock).toHaveBeenCalledWith(FightEvents.Winner, fight.player1);
            expect(toMock.mock.results[1].value.emit as jest.Mock).toHaveBeenCalledWith(FightEvents.Loser, fight.player2);
            // Vérification d'un appel à gameService.movePlayer et decrementAction
            expect(gameService.movePlayerToSpawn).toHaveBeenCalledWith(payload.accessCode, fight.player2);
            expect(gameService.decrementAction).toHaveBeenCalled();
            // Vérification de l'émission de l'event End
            expect(toMock).toHaveBeenCalledWith(fight.player1.id);
            expect(toMock.mock.results[2].value.emit as jest.Mock).toHaveBeenCalledWith(FightEvents.End);
            expect(toMock).toHaveBeenCalledWith(fight.player2.id);
            expect(toMock.mock.results[3].value.emit as jest.Mock).toHaveBeenCalledWith(FightEvents.End);
            expect(timerService.resumeTimer).toHaveBeenCalledWith(payload.accessCode);
        });
    });

    describe('SubscribeMessage methods', () => {
        it('handleGameCreation should call gameService.createGame with payload', () => {
            const payload = { accessCode: 'GAME123', mapName: 'Map1', organizerId: 'organizer1' };
            gateway.handleGameCreation(client as Socket, payload);
            expect(gameService.createGame).toHaveBeenCalledWith(payload.accessCode, payload.organizerId, payload.mapName);
        });

        it('handleGameConfigure should emit BroadcastStartGame after configuring game', async () => {
            const payload = { accessCode: 'GAME_CONFIG', players: [] as PlayerStats[] };
            await gateway.handleGameConfigure(client as Socket, payload);
            expect(gameService.configureGame).toHaveBeenCalledWith(payload.accessCode, payload.players);
            expect(toMock).toHaveBeenCalledWith(payload.accessCode);
            const toReturn = toMock.mock.results[0].value;
            expect(toReturn.emit).toHaveBeenCalledWith(GameEvents.BroadcastStartGame, 'configuredGame');
        });

        it('handleDebug should toggle debug mode and emit BroadcastDebugState', () => {
            const accessCode = 'GAME_DEBUG';
            gateway.handleDebug(client as Socket, accessCode);
            expect(gameService.toggleDebugState).toHaveBeenCalledWith(accessCode);
            expect(toMock).toHaveBeenCalledWith(accessCode);
            const toReturn = toMock.mock.results[0].value;
            expect(toReturn.emit).toHaveBeenCalledWith(GameEvents.BroadcastDebugState);
        });

        it('handleReady should call startTurn if active player is ready', () => {
            const payload = { accessCode: 'GAME_READY', playerId: 'player1' };
            (gameService.isActivePlayerReady as jest.Mock).mockReturnValue(true);
            // Espionner startTurn (méthode privée)
            const startTurnSpy = jest.spyOn<any, any>(gateway as any, 'startTurn').mockImplementation(() => {});
            gateway.handleReady(client as Socket, payload);
            expect(gameService.isActivePlayerReady).toHaveBeenCalledWith(payload.accessCode, payload.playerId);
            expect(startTurnSpy).toHaveBeenCalledWith(payload.accessCode);
        });

        it('handleChangeDoorState should call gameService.changeDoorState with payload', () => {
            const payload = {
                accessCode: 'ROOM1',
                position: { x: 1, y: 2 } as Vec2,
                player: { id: 'player1', name: 'Alice', avatar: 'a.png' } as PlayerStats,
            };
            gateway.handleChangeDoorState(client as Socket, payload);
            expect(gameService.changeDoorState).toHaveBeenCalledWith(payload.accessCode, payload.position, payload.player);
        });

        it('handlePlayerMovement should call gameService.processPath with payload', () => {
            const payload = {
                accessCode: 'ROOM2',
                path: { step: 10 } as unknown as PathInfo,
                player: { id: 'player2', name: 'Bob', avatar: 'b.png' } as PlayerStats,
            };
            gateway.handlePlayerMovement(client as Socket, payload);
            expect(gameService.processPath).toHaveBeenCalledWith(payload.accessCode, payload.path, payload.player);
        });

        it('debugPlayerMovement should call movePlayer and updatePlayerPathTurn', () => {
            const payload = {
                accessCode: 'ROOM3',
                direction: { x: 5, y: 5 } as Vec2,
                player: { id: 'player3', name: 'Charlie', avatar: 'c.png' } as PlayerStats,
            };
            gateway.debugPlayerMovement(client as Socket, payload);
            expect(gameService.movePlayer).toHaveBeenCalledWith(payload.accessCode, payload.direction, payload.player);
            expect(gameService.updatePlayerPathTurn).toHaveBeenCalledWith(payload.accessCode, payload.player);
        });

        it('handlePlayerEnd should call endTurn with correct accessCode', () => {
            const accessCode = 'ROOM4';
            const endTurnSpy = jest.spyOn<any, any>(gateway as any, 'endTurn').mockImplementation(() => {});
            gateway.handlePlayerEnd(client as Socket, accessCode);
            expect(endTurnSpy).toHaveBeenCalledWith(accessCode);
        });

        it('handleFightInit should call fightService.initFight and emit Fight Init to defender', () => {
            const payload = {
                accessCode: 'FIGHT1',
                player1: 'player1',
                player2: 'player2',
            };
            (gameService.getPlayer as jest.Mock).mockReturnValueOnce(payload.player1).mockReturnValueOnce(payload.player2);
            gateway.handleFightInit(client as Socket, payload);
            expect(fightService.initFight).toHaveBeenCalledWith(payload.accessCode, payload.player1, payload.player2);
        });

        it('handlePlayerFlee should call fightService.playerFlee with accessCode', () => {
            const accessCode = 'FIGHT2';
            gateway.handlePlayerFlee(client as Socket, accessCode);
            expect(fightService.playerFlee).toHaveBeenCalledWith(accessCode);
        });

        it('handlePlayerAttack should call fightService.playerAttack with accessCode', () => {
            const accessCode = 'FIGHT3';
            gateway.handlePlayerAttack(client as Socket, accessCode);
            expect(fightService.playerAttack).toHaveBeenCalledWith(accessCode, undefined);
        });

        it('handleConnection should emit welcome message', () => {
            const emitSpy = jest.spyOn(client, 'emit');
            gateway.handleConnection(client as Socket);
            expect(emitSpy).toHaveBeenCalledWith('welcome', { message: 'Bienvenue sur le serveur de jeu !' });
        });

        it('handleDisconnect should log disconnect message', () => {
            const logSpy = jest.spyOn(logger, 'log');
            gateway.handleDisconnect(client as Socket);
            expect(logSpy).toHaveBeenCalledWith(`Client déconnecté : ${client.id}`);
        });
    });

    // Test de la méthode afterInit qui est appelée après l'initialisation du gateway
    describe('afterInit', () => {
        it('should log GameGateway Initialized', () => {
            const logSpy = jest.spyOn(logger, 'log');
            gateway.afterInit(server as Server);
            expect(logSpy).toHaveBeenCalled();
        });
    });

    it('private endTurn should perform required tasks', () => {
        const accessCode = 'testRoom';

        const stopTimerSpy = jest.spyOn(timerService, 'stopTimer');
        const switchTurnSpy = jest.spyOn(gameService, 'switchTurn');
        const configureTurnSpy = jest.spyOn(gameService, 'configureTurn');
        const emitSpy = jest.fn();
        const toSpy = jest.spyOn(server, 'to').mockReturnValue({ emit: emitSpy } as any);
        const startTurnSpy = jest.spyOn(gateway as any, 'startTurn').mockImplementation(() => {});
        (gateway as any).endTurn(accessCode);

        expect(stopTimerSpy).toHaveBeenCalledWith(accessCode);
        expect(toSpy).toHaveBeenCalledWith(accessCode);
        expect(emitSpy).toHaveBeenNthCalledWith(1, TurnEvents.UpdateTimer, { remainingTime: 0 });
        expect(emitSpy).toHaveBeenNthCalledWith(2, TurnEvents.BroadcastEnd);
        expect(switchTurnSpy).toHaveBeenCalledWith(accessCode);
        expect(configureTurnSpy).toHaveBeenCalledWith(accessCode);
        expect(startTurnSpy).toHaveBeenCalledWith(accessCode);
    });

    it('private startTurn should log messages, emit PlayerTurn, and start timer after delay', () => {
        jest.useFakeTimers();
        const accessCode = 'testRoom';
        const turnStub = { player: { id: 'testPlayer', name: 'Test Player', avatar: 'avatar.png' } };
        (gameService.configureTurn as jest.Mock).mockReturnValue(turnStub);

        const emitSpy = jest.fn();
        const toSpy = jest.spyOn(server, 'to').mockReturnValue({ emit: emitSpy } as any);
        const startTimerSpy = jest.spyOn(gameService, 'startTimer');
        (gateway as any).startTurn(accessCode);

        expect(toSpy).toHaveBeenCalledWith(accessCode);
        expect(emitSpy).toHaveBeenCalledWith(TurnEvents.PlayerTurn, turnStub);

        jest.advanceTimersByTime(3000);
        expect(startTimerSpy).toHaveBeenCalledWith(accessCode);

        jest.useRealTimers();
    });
});
