/* eslint-disable @typescript-eslint/no-explicit-any */
import { GameGateway } from '@app/gateways/game/game.gateway';
// import { GameService } from '@app/services/game.service';
// import { Vec2 } from '@common/board';
// import { TurnEvents } from '@common/game.gateway.events';
// import { Logger } from '@nestjs/common';
// import { TimerService } from '@app/services/timer/timer.service';
// import { Server, Socket } from 'socket.io';

describe('GameGateway', () => {
    let gateway: GameGateway;
    // let gameService: Partial<GameService>;
    // let timerService: Partial<TimerService>;
    // let server: Partial<Server>;
    // let client: Partial<Socket>;
    // let logger: Logger;
    let toMock: jest.Mock;
    let gameService: any;
    let server: any;
    // let client: any;

    beforeEach(() => {
        gameService = {
            createGame: jest.fn(),
            configureGame: jest.fn().mockResolvedValue('configuredGame'),
            changeDoorState: jest.fn().mockReturnValue('newDoorState'),
        };

        toMock = jest.fn().mockReturnValue({ emit: jest.fn() });
        server = {
            to: toMock,
            emit: jest.fn(),
        };

        // client = {
        //     id: 'socket1',
        //     emit: jest.fn(),
        // };

        // Instantiate the gateway with mocked dependencies
        gateway = new GameGateway(gameService as any, {} as any, {} as any);
        gateway.server = server as any;
    });

    describe('Service creation', () => {
        it('should create the GameGateway service', () => {
            expect(gateway).toBeDefined();
            expect(gateway).toBeInstanceOf(GameGateway);
        });
    });

    //     describe('handleGameCreation', () => {
    //         it('should call createGame with correct parameters', () => {
    //             const payload = { accessCode: 'GAME123', mapName: 'Map1', organizerId: 'Player1' };
    //             gateway.handleGameCreation(client as Socket, payload);
    //             expect(gameService.createGame).toHaveBeenCalledWith(payload.accessCode, payload.organizerId, payload.mapName);
    //         });
    //     });

    //     describe('handleGameConfigure', () => {
    //         it('should configure the game and emit start game event', async () => {
    //             const payload = { accessCode: 'GAME123', players: [] };
    //             await gateway.handleGameConfigure(client as Socket, payload);
    //             expect(gameService.configureGame).toHaveBeenCalledWith(payload.accessCode, payload.players);
    //             expect(toMock).toHaveBeenCalledWith(payload.accessCode);
    //             const toReturn = toMock.mock.results[0].value;
    //             expect(toReturn.emit).toHaveBeenCalledWith('BroadcastStartGame', 'configuredGame');
    //         });
    //     });

    //     describe('handleDebug', () => {
    //         it('should toggle debug mode and emit debug state', () => {
    //             const accessCode = 'GAME123';
    //             gateway.handleDebug(client as Socket, accessCode);
    //             expect(gameService.toggleDebugState).toHaveBeenCalledWith(accessCode);
    //             expect(toMock).toHaveBeenCalledWith(accessCode);
    //             const toReturn = toMock.mock.results[0].value;
    //             expect(toReturn.emit).toHaveBeenCalledWith('BroadcastDebugState');
    //         });
    //     });

    //     describe('handleReady', () => {
    //         it('should start turn if active player is ready', () => {
    //             const payload = { accessCode: 'GAME123', playerId: 'Player1' };
    //             jest.spyOn(gameService, 'isActivePlayerReady').mockReturnValue(true);
    //             const startTurnSpy = jest.spyOn(gateway as any, 'startTurn').mockImplementation();
    //             gateway.handleReady(client as Socket, payload);
    //             expect(gameService.isActivePlayerReady).toHaveBeenCalledWith(payload.accessCode, payload.playerId);
    //             expect(startTurnSpy).toHaveBeenCalledWith(payload.accessCode);
    //         });
    //     });
    //     logger = new Logger('GameGateway');
    //     jest.spyOn(logger, 'log').mockImplementation();

    //     gateway = new GameGateway(gameService as GameService, timerService as TimerService);
    //     gateway.server = server as Server;
    //     (gateway as any).logger = logger;
    // });

    // describe('handleChangeDoorState', () => {
    //     it('should change door state and emit broadcast door state', () => {
    //         const payload = { accessCode: 'GAME123', position: { x: 5, y: 10 } as Vec2 };
    //         gateway.handleChangeDoorState(client as Socket, payload);
    //         expect(gameService.changeDoorState).toHaveBeenCalledWith(payload.accessCode, payload.position);
    //         expect(toMock).toHaveBeenCalledWith(payload.accessCode);
    //         const toReturn = toMock.mock.results[0].value;
    //         expect(toReturn.emit).toHaveBeenCalledWith(TurnEvents.BroadcastDoor, { position: payload.position, newState: 'newDoorState' });
    //     });
    // });

    // describe('Lifecycle hooks', () => {
    //     it('afterInit should log initialization', () => {
    //         const dummyServer = {} as Server;
    //         gateway.afterInit(dummyServer);
    //         expect(logger.log).toHaveBeenCalledWith('GameGateway Initialized' + dummyServer);
    //     });

    //     it('handleConnection should log and emit welcome message', () => {
    //         gateway.handleConnection(client as Socket);
    //         expect(logger.log).toHaveBeenCalledWith(`Client connecté : ${client.id}`);
    //         expect(client.emit).toHaveBeenCalledWith('welcome', { message: 'Bienvenue sur le serveur de jeu !' });
    //     });

    //     it('handleDisconnect should log disconnection', () => {
    //         gateway.handleDisconnect(client as Socket);
    //         expect(logger.log).toHaveBeenCalledWith(`Client déconnecté : ${client.id}`);
    //     });
    // });
});
