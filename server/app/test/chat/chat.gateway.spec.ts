/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { GameManagerService } from '@app/services/game/games-manager.service';
import { ChatMessage } from '@common/chat';
import { ChatEvents } from '@common/chat.gateway.events';
import { IPlayer, Team } from '@common/player';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let gameManagerService: SinonStubbedInstance<GameManagerService>;
    let mockSender: IPlayer;

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);
        gameManagerService = createStubInstance<GameManagerService>(GameManagerService);

        mockSender = {
            id: 'sender123',
            name: 'Test Sender',
            avatar: 'avatar1',
            attackPower: 5,
            defensePower: 3,
            speed: 2,
            life: 10,
            attackDice: 'D6',
            defenseDice: 'D4',
            team: Team.Red,
            actions: 1,
            wins: 0,
            movementPts: 2,
            position: { x: 0, y: 0 },
            spawnPosition: { x: 0, y: 0 },
            fleeAttempts: 2,
            currentLife: 10,
            diceResult: 5,
            inventory: [],
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatGateway,
                {
                    provide: Logger,
                    useValue: logger,
                },
                {
                    provide: GameManagerService,
                    useValue: gameManagerService,
                },
            ],
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);
        // eslint-disable-next-line dot-notation
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('roomMessage', () => {
        it('should process room message and broadcast it', () => {
            const mockRoom = {
                addMessage: jest.fn(),
            };
            const mockMessage: ChatMessage = {
                accessCode: 'room123',
                sender: mockSender,
                message: 'Hello World',
                timestamp: new Date().toISOString(),
            };

            gameManagerService.getRoom.returns(mockRoom as any);
            stub(socket, 'broadcast').value({
                to: (roomId: string) => ({
                    emit: (event: string, data: any) => {
                        expect(roomId).toEqual('room123');
                        expect(event).toEqual(ChatEvents.RoomMessage);
                        expect(data).toEqual(mockMessage);
                    },
                }),
            });

            gateway.roomMessage(socket, mockMessage);

            expect(gameManagerService.getRoom.called).toBe(true);
            expect(mockRoom.addMessage).toHaveBeenCalledWith(mockMessage);
        });

        it('should handle empty message gracefully', () => {
            const mockRoom = {
                addMessage: jest.fn(),
            };
            const mockMessage: ChatMessage = {
                accessCode: 'room123',
                sender: mockSender,
                message: '',
                timestamp: new Date().toISOString(),
            };

            gameManagerService.getRoom.returns(mockRoom as any);
            stub(socket, 'broadcast').value({
                to: () => ({
                    emit: jest.fn(),
                }),
            });

            gateway.roomMessage(socket, mockMessage);

            expect(gameManagerService.getRoom.called).toBe(true);
            expect(mockRoom.addMessage).toHaveBeenCalled();
        });
    });

    describe('handleConnection', () => {
        it('should log connection and emit hello message', () => {
            gateway.handleConnection(socket);

            expect(logger.log).toBeCalled();
            expect(socket.emit.calledWith(ChatEvents.Hello, 'Hello World!')).toBe(true);
        });
    });

    describe('handleDisconnect', () => {
        it('should log disconnection', () => {
            gateway.handleDisconnect(socket);

            expect(logger.log).toBeCalled();
        });
    });

    describe('integrated testing', () => {
        it('should properly interact with GameManagerService', () => {
            const mockRoom = {
                addMessage: jest.fn(),
            };

            const mockMessage: ChatMessage = {
                accessCode: 'room123',
                sender: mockSender,
                message: 'Test message',
                timestamp: new Date().toISOString(),
            };
            gameManagerService.getRoom.returns(mockRoom as any);
            stub(socket, 'broadcast').value({
                to: () => ({ emit: jest.fn() }),
            });

            gateway.handleConnection(socket);
            gateway.roomMessage(socket, mockMessage);
            gateway.handleDisconnect(socket);

            expect(gameManagerService.getRoom.called).toBe(true);
            expect(mockRoom.addMessage).toHaveBeenCalled();
            expect(socket.emit.calledWith(ChatEvents.Hello)).toBe(true);
        });
    });
});
