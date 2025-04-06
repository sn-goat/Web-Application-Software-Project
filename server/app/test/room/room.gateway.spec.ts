/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Player } from '@app/class/player';
import { Room } from '@app/class/room';
import { RoomGateway } from '@app/gateways/room/room.gateway';
import { GameManagerService } from '@app/services/game/games-manager.service';
import { PlayerInput } from '@common/player';
import { RoomEvents } from '@common/room.gateway.events';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { JournalService } from '@app/services/journal/journal.service';

describe('RoomGateway', () => {
    let gateway: RoomGateway;
    let server: jest.Mocked<Server>;
    let gameManager: jest.Mocked<GameManagerService>;
    let emitMock: jest.Mock;
    let client: jest.Mocked<Socket>;
    let journalService: jest.Mocked<JournalService>;

    beforeEach(async () => {
        emitMock = jest.fn();

        const socketMap = new Map<string, Socket>();

        server = {
            to: jest.fn().mockReturnValue({
                emit: emitMock,
                to: jest.fn().mockReturnThis(),
                except: jest.fn().mockReturnThis(),
                timeout: jest.fn().mockReturnThis(),
            }),
            sockets: {
                sockets: socketMap,
            },
        } as unknown as jest.Mocked<Server>;

        client = {
            id: 'client-id',
            emit: jest.fn(),
            join: jest.fn(),
            leave: jest.fn(),
            rooms: new Set<string>(['room123']),
        } as unknown as jest.Mocked<Socket>;

        // Add the client socket to the server sockets map
        server.sockets.sockets.set = jest.fn().mockImplementation((id, socket) => {
            socketMap.set(id, socket);
            return socketMap;
        });
        server.sockets.sockets.get = jest.fn().mockImplementation(() => {
            return client;
        });

        gameManager = {
            openRoom: jest.fn(),
            getRoom: jest.fn(),
            closeRoom: jest.fn(),
        } as unknown as jest.Mocked<GameManagerService>;

        journalService = {
            dispatchEvent: jest.fn(),
        } as unknown as jest.Mocked<JournalService>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomGateway,
                { provide: GameManagerService, useValue: gameManager },
                { provide: Logger, useValue: new Logger() },
                { provide: JournalService, useValue: journalService },
            ],
        }).compile();

        gateway = module.get<RoomGateway>(RoomGateway);
        gateway['server'] = server as any;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('Event Handlers', () => {
        it('handleClosingRoom should close room', () => {
            const accessCode = 'room123';

            gateway.handleClosingRoom(accessCode);

            expect(gameManager.closeRoom).toHaveBeenCalledWith(accessCode);
        });

        it('handlePlayerRemoved should emit event and remove player from room', () => {
            const errorSpy = jest.spyOn(Logger.prototype, 'log');
            const payload = {
                accessCode: 'room123',
                name: 'player',
                playerId: 'player123',
                message: 'Player was removed',
            };

            gateway.handlePlayerRemoved(payload);

            expect(server.to).toHaveBeenCalledWith(payload.playerId);
            expect(emitMock).toHaveBeenCalledWith(RoomEvents.PlayerRemoved, payload.message);
            expect(errorSpy).toHaveBeenCalled();
            expect(client.leave).toHaveBeenCalledWith(payload.accessCode);
        });

        it('handleUpdatePlayers should emit updated players to room', () => {
            const players = [{ id: 'player1', name: 'Alice' } as Player, { id: 'player2', name: 'Bob' } as Player];
            const payload = { accessCode: 'room123', players };

            gateway.handleUpdatePlayers(payload);

            expect(server.to).toHaveBeenCalledWith(payload.accessCode);
            expect(emitMock).toHaveBeenCalledWith(RoomEvents.PlayersUpdated, payload.players);
        });
    });

    describe('Socket Message Handlers', () => {
        it('handleCreateRoom should create a room and join client to it', async () => {
            const errorSpy = jest.spyOn(Logger.prototype, 'log');
            const mapName = 'testMap';
            const room = {
                accessCode: 'ABC123',
            } as Room;

            gameManager.openRoom.mockResolvedValue(room);

            await gateway.handleCreateRoom(client, mapName);

            expect(gameManager.openRoom).toHaveBeenCalledWith(client.id, mapName);
            expect(client.join).toHaveBeenCalledWith(room.accessCode);
            expect(client.emit).toHaveBeenCalledWith(RoomEvents.RoomCreated, room);
            expect(errorSpy).toHaveBeenCalled();
        });

        it('handleJoinRoom should emit error when room does not exist', () => {
            const accessCode = 'nonexistent';

            gameManager.getRoom.mockReturnValue(undefined);

            gateway.handleJoinRoom(client, accessCode);

            expect(gameManager.getRoom).toHaveBeenCalledWith(accessCode);
            expect(client.emit).toHaveBeenCalledWith(RoomEvents.JoinError, "Impossible de rejoindre la salle, car elle n'existe pas.");
        });

        it('handleJoinRoom should emit error when room is locked', () => {
            const accessCode = 'locked-room';
            const room = {
                accessCode,
                isLocked: true,
            } as Room;

            gameManager.getRoom.mockReturnValue(room);

            gateway.handleJoinRoom(client, accessCode);

            expect(client.emit).toHaveBeenCalledWith(RoomEvents.JoinError, 'Impossible de rejoindre la salle, car elle est verrouillée.');
        });

        it('handleJoinRoom should join room when available', () => {
            const accessCode = 'available-room';
            const room = {
                accessCode,
                isLocked: false,
            } as Room;

            gameManager.getRoom.mockReturnValue(room);

            gateway.handleJoinRoom(client, accessCode);

            expect(client.join).toHaveBeenCalledWith(accessCode);
            expect(server.to).toHaveBeenCalledWith(accessCode);
            expect(emitMock).toHaveBeenCalledWith(RoomEvents.PlayerJoined, room);
        });

        it('handleShareCharacter should add player to room and emit updates', () => {
            const accessCode = 'room123';
            const playerInput = { name: 'Alice' } as PlayerInput;
            const payload = { accessCode, player: playerInput };

            const room = {
                accessCode,
                addPlayer: jest.fn(),
            } as unknown as Room;

            gameManager.getRoom.mockReturnValue(room);

            gateway.handleShareCharacter(client, payload);

            expect(gameManager.getRoom).toHaveBeenCalledWith(accessCode);
            expect(room.addPlayer).toHaveBeenCalled();
            expect(client.emit).toHaveBeenCalledWith(RoomEvents.SetCharacter, expect.any(Player));
            expect(server.to).toHaveBeenCalledWith(accessCode);
            expect(emitMock).toHaveBeenCalledWith(RoomEvents.PlayerJoined, room);
        });

        it('handleLockRoom should lock room and emit event', () => {
            const accessCode = 'room123';
            const room = {
                setLock: jest.fn(),
            } as unknown as Room;

            gameManager.getRoom.mockReturnValue(room);

            gateway.handleLockRoom(client, accessCode);

            expect(gameManager.getRoom).toHaveBeenCalledWith(accessCode);
            expect(room.setLock).toHaveBeenCalledWith(true);
            expect(server.to).toHaveBeenCalledWith(accessCode);
            expect(emitMock).toHaveBeenCalledWith(RoomEvents.RoomLocked);
        });

        it('handleUnlockRoom should unlock room and emit event', () => {
            const accessCode = 'room123';
            const room = {
                setLock: jest.fn(),
            } as unknown as Room;

            gameManager.getRoom.mockReturnValue(room);

            gateway.handleUnlockRoom(client, accessCode);

            expect(gameManager.getRoom).toHaveBeenCalledWith(accessCode);
            expect(room.setLock).toHaveBeenCalledWith(false);
            expect(server.to).toHaveBeenCalledWith(accessCode);
            expect(emitMock).toHaveBeenCalledWith(RoomEvents.RoomUnlocked);
        });

        it('handleRemovePlayer should expel player from room', () => {
            const accessCode = 'room123';
            const playerId = 'player456';
            const payload = { accessCode, playerId };

            const room = {
                expelPlayer: jest.fn(),
            } as unknown as Room;

            gameManager.getRoom.mockReturnValue(room);

            gateway.handleRemovePlayer(client, payload);

            expect(gameManager.getRoom).toHaveBeenCalledWith(accessCode);
            expect(room.expelPlayer).toHaveBeenCalledWith(playerId);
        });

        it('handleDisconnectPlayer should remove player from room', () => {
            const accessCode = 'room123';
            const playerId = 'player456';
            const payload = { accessCode, playerId };

            const room = {
                removePlayer: jest.fn(),
            } as unknown as Room;

            gameManager.getRoom.mockReturnValue(room);

            gateway.handleDisconnectPlayer(client, payload);

            expect(gameManager.getRoom).toHaveBeenCalledWith(accessCode);
            expect(room.removePlayer).toHaveBeenCalledWith(playerId);
        });
    });

    describe('Gateway Lifecycle Methods', () => {
        it('afterInit should log initialization', () => {
            const errorSpy = jest.spyOn(Logger.prototype, 'log');
            gateway.afterInit(server as Server);

            expect(errorSpy).toHaveBeenCalled();
        });

        it('handleConnection should emit welcome message', () => {
            const errorSpy = jest.spyOn(Logger.prototype, 'log');
            gateway.handleConnection(client);

            expect(errorSpy).toHaveBeenCalled();
            expect(client.emit).toHaveBeenCalledWith(RoomEvents.Welcome, { message: 'Bienvenue sur le serveur de jeu !' });
        });

        it('handleDisconnect should remove player from all rooms', () => {
            const errorSpy = jest.spyOn(Logger.prototype, 'log');
            const roomId = 'room123';
            const mockRoom = {
                removePlayer: jest.fn(),
            } as unknown as Room;

            gameManager.getRoom.mockReturnValue(mockRoom);

            gateway.handleDisconnect(client);

            expect(errorSpy).toHaveBeenCalled();
            expect(gameManager.getRoom).toHaveBeenCalledWith(roomId);
            expect(mockRoom.removePlayer).toHaveBeenCalledWith(client.id);
        });
    });
});
