/* eslint-disable @typescript-eslint/no-explicit-any */
import { GameGateway } from '@app/gateways/game/game.gateway';
import { GameService } from '@app/services/game.service';
import { Vec2 } from '@common/board';
import { GameEvents, TurnEvents } from '@common/game.gateway.events';
import { PlayerStats } from '@common/player';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

describe('GameGateway', () => {
    let gateway: GameGateway;
    let gameService: Partial<GameService>;
    let server: Partial<Server>;
    let client: Partial<Socket>;
    let logger: Logger;
    let toMock: jest.Mock;

    beforeEach(() => {
        gameService = {
            createGame: jest.fn(),
            configureGame: jest.fn().mockResolvedValue('configuredGame'),
            changeDebugState: jest.fn().mockReturnValue(true),
            changeDoorState: jest.fn().mockReturnValue('newDoorState'),
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

        logger = new Logger('GameGateway');
        jest.spyOn(logger, 'log').mockImplementation();

        gateway = new GameGateway(gameService as GameService);
        gateway.server = server as Server;
        (gateway as any).logger = logger;
    });

    describe('handleGameCreation', () => {
        it('should log game creation and call gameService.createGame with payload', () => {
            const payload = { accessCode: 'GAME123', organizerId: 'org1', mapName: 'Test Map' };
            gateway.handleGameCreation(client as Socket, payload);
            expect(logger.log).toHaveBeenCalledWith('Creating game with payload: ' + payload.organizerId);
            expect(gameService.createGame).toHaveBeenCalledWith(payload.accessCode, payload.organizerId, payload.mapName);
        });
    });

    describe('handleGameConfigure', () => {
        it('should configure game, emit broadcast and log appropriately', async () => {
            const payload = { accessCode: 'GAME123', players: [{ id: 'p1', name: 'Player 1' } as PlayerStats] };
            await gateway.handleGameConfigure(client as Socket, payload);
            expect(gameService.configureGame).toHaveBeenCalledWith(payload.accessCode, payload.players);
            expect(toMock).toHaveBeenCalledWith(payload.accessCode);
            const toReturn = toMock.mock.results[0].value;
            expect(toReturn.emit).toHaveBeenCalledWith(GameEvents.BroadcastStartGame, { game: 'configuredGame' });
            expect(logger.log).toHaveBeenCalledWith('Creating game with payload: org1');
            expect(logger.log).toHaveBeenCalledWith('Game configured');
            expect(logger.log).toHaveBeenCalledWith('Game started');
        });
    });

    describe('handleDebug', () => {
        it('should change debug state and emit broadcast debug state', () => {
            const payload = { accessCode: 'GAME123' };
            gateway.handleDebug(client as Socket, payload);
            expect(gameService.changeDebugState).toHaveBeenCalledWith(payload.accessCode);
            expect(toMock).toHaveBeenCalledWith(payload.accessCode);
            const toReturn = toMock.mock.results[0].value;
            expect(toReturn.emit).toHaveBeenCalledWith(GameEvents.BroadcastDebugState, { isDebugMode: true });
        });
    });

    describe('handleChangeDoorState', () => {
        it('should change door state and emit broadcast door state', () => {
            const payload = { accessCode: 'GAME123', position: { x: 5, y: 10 } as Vec2 };
            gateway.handleChangeDoorState(client as Socket, payload);
            expect(gameService.changeDoorState).toHaveBeenCalledWith(payload.accessCode, payload.position);
            expect(toMock).toHaveBeenCalledWith(payload.accessCode);
            const toReturn = toMock.mock.results[0].value;
            expect(toReturn.emit).toHaveBeenCalledWith(TurnEvents.BroadcastDoor, { position: payload.position, newState: 'newDoorState' });
        });
    });

    describe('Lifecycle hooks', () => {
        it('afterInit should log initialization', () => {
            const dummyServer = {} as Server;
            gateway.afterInit(dummyServer);
            expect(logger.log).toHaveBeenCalledWith('GameGateway Initialized' + dummyServer);
        });

        it('handleConnection should log and emit welcome message', () => {
            gateway.handleConnection(client as Socket);
            expect(logger.log).toHaveBeenCalledWith(`Client connecté : ${client.id}`);
            expect(client.emit).toHaveBeenCalledWith('welcome', { message: 'Bienvenue sur le serveur de jeu !' });
        });

        it('handleDisconnect should log disconnection', () => {
            gateway.handleDisconnect(client as Socket);
            expect(logger.log).toHaveBeenCalledWith(`Client déconnecté : ${client.id}`);
        });
    });
});
