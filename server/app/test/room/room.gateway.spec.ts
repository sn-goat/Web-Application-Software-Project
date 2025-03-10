/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { RoomGateway } from '@app/gateways/room/room.gateway';
import { RoomService } from '@app/services/room.service';
import { PlayerStats } from '@common/player';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Socket } from 'socket.io';

describe('RoomGateway', () => {
    let gateway: RoomGateway;
    let roomService: Partial<RoomService>;
    let client: Partial<Socket>;
    let server: any; // mock server
    let eventEmitter: EventEmitter2;

    beforeEach(() => {
        // Create a mock game service with jest.fn() for each method.
        roomService = {
            createRoom: jest.fn(),
            joinRoom: jest.fn(),
            lockRoom: jest.fn(),
            unlockRoom: jest.fn(),
            shareCharacter: jest.fn(),
            removePlayer: jest.fn(),
            disconnectPlayer: jest.fn(),
            getRoom: jest.fn(),
        };
        eventEmitter = new EventEmitter2(); // Instantiate EventEmitter2
        
        // Create a fake server that returns an object with an emit method.
        server = {
            to: jest.fn().mockReturnValue({
                emit: jest.fn(),
            }),
        };

        // Instantiate the gateway and inject the mocked service.
        gateway = new RoomGateway(roomService as RoomService, eventEmitter);
        gateway.server = server;

        // Create a fake client socket.
        client = {
            join: jest.fn(),
            emit: jest.fn(),
            id: 'socket1',
        };
    });

    describe('handleCreateGame', () => {
        it('should create a game and emit gameCreated', () => {
            const payload = { organizerId: 'org1', size: 5 };
            const room = { accessCode: 'ROOM123' };
            (roomService.createRoom as jest.Mock).mockReturnValue(room);

            gateway.handleCreateRoom(client as Socket, payload);

            expect(roomService.createRoom).toHaveBeenCalledWith(payload.organizerId, payload.size);
            expect(client.join).toHaveBeenCalledWith(room.accessCode);
            expect(client.emit).toHaveBeenCalledWith('roomCreated', room);
        });
    });

    describe('handleGetRoom', () => {
        it('should emit RoomError when room is not found', () => {
            const payload = { accessCode: 'NON_EXISTENT_ROOM' };
            // Simulate that getRoom returns null (room not found)
            (roomService.getRoom as jest.Mock).mockReturnValue(null);

            gateway.handleGetRoom(client as Socket, payload);

            // Expect the client to receive the error event with the correct message
            expect(client.emit).toHaveBeenCalledWith('roomError', { message: 'Salle introuvable.' });
        });

        it('should emit RoomData when room is found', () => {
            const payload = { accessCode: 'ROOM123' };
            const room = { accessCode: 'ROOM123', name: 'Test Room' }; // sample room object
            // Simulate that getRoom returns a valid room
            (roomService.getRoom as jest.Mock).mockReturnValue(room);

            gateway.handleGetRoom(client as Socket, payload);

            // Expect the client to receive the room data event with the room object
            expect(client.emit).toHaveBeenCalledWith('roomData', room);
        });
    });

    describe('handleJoinGame', () => {
        it('should join game successfully and emit playerJoined', () => {
            const payload = { accessCode: 'ROOM123' };
            const room = { accessCode: 'ROOM123' };
            (roomService.joinRoom as jest.Mock).mockReturnValue(room);
            const roomEmitMock = jest.fn();
            (server.to as jest.Mock).mockReturnValue({ emit: roomEmitMock });

            gateway.handleJoinRoom(client as Socket, payload);

            expect(roomService.joinRoom).toHaveBeenCalledWith(payload.accessCode);
            expect(client.join).toHaveBeenCalledWith(payload.accessCode);
            expect(server.to).toHaveBeenCalledWith(payload.accessCode);
            expect(roomEmitMock).toHaveBeenCalledWith('playerJoined', { room });
        });

        it('should emit joinError when joinGame fails', () => {
            const payload = { accessCode: 'ROOM123' };
            (roomService.joinRoom as jest.Mock).mockReturnValue(null);

            gateway.handleJoinRoom(client as Socket, payload);

            expect(client.emit).toHaveBeenCalledWith('joinError', {
                message: "Impossible de rejoindre la salle. Elle est peut-être verrouillée ou n'existe pas.",
            });
        });
    });

    describe('handleLockRoom', () => {
        it('should lock room successfully and emit roomLocked', () => {
            const payload = { accessCode: 'ROOM123' };
            const room = { accessCode: 'ROOM123' };
            (roomService.lockRoom as jest.Mock).mockReturnValue(room);
            const roomEmitMock = jest.fn();
            (server.to as jest.Mock).mockReturnValue({ emit: roomEmitMock });

            gateway.handleLockRoom(client as Socket, payload);

            expect(roomService.lockRoom).toHaveBeenCalledWith(payload.accessCode);
            expect(server.to).toHaveBeenCalledWith(payload.accessCode);
            expect(roomEmitMock).toHaveBeenCalledWith('roomLocked', { room });
        });

        it('should emit lockError when lockRoom fails', () => {
            const payload = { accessCode: 'ROOM123' };
            (roomService.lockRoom as jest.Mock).mockReturnValue(null);

            gateway.handleLockRoom(client as Socket, payload);

            expect(client.emit).toHaveBeenCalledWith('lockError', { message: 'Impossible de verrouiller la salle.' });
        });
    });

    describe('handleUnlockRoom', () => {
        it('should unlock room successfully and emit roomUnlocked', () => {
            const payload = { accessCode: 'ROOM123' };
            const room = { accessCode: 'ROOM123' };
            (roomService.unlockRoom as jest.Mock).mockReturnValue(room);
            const roomEmitMock = jest.fn();
            (server.to as jest.Mock).mockReturnValue({ emit: roomEmitMock });

            gateway.handleUnlockRoom(client as Socket, payload);

            expect(roomService.unlockRoom).toHaveBeenCalledWith(payload.accessCode);
            expect(server.to).toHaveBeenCalledWith(payload.accessCode);
            expect(roomEmitMock).toHaveBeenCalledWith('roomUnlocked', { room });
        });

        it('should emit unlockError when unlockRoom fails', () => {
            const payload = { accessCode: 'ROOM123' };
            (roomService.unlockRoom as jest.Mock).mockReturnValue(null);

            gateway.handleUnlockRoom(client as Socket, payload);

            expect(client.emit).toHaveBeenCalledWith('unlockError', { message: 'Impossible de déverrouiller la salle.' });
        });
    });

    describe('handleShareCharacter', () => {
        it('should share character successfully and emit playerJoined', () => {
            const payload = { accessCode: 'ROOM123', player: { id: 'player1', name: 'PlayerStats One' } };
            const room = { accessCode: 'ROOM123' };
            (roomService.shareCharacter as jest.Mock).mockReturnValue(room);
            const roomEmitMock = jest.fn();
            (server.to as jest.Mock).mockReturnValue({ emit: roomEmitMock });

            const updatedPayload: { accessCode: string; player: PlayerStats } = {
                accessCode: payload.accessCode,
                player: {
                    id: payload.player.id,
                    name: payload.player.name,
                    avatar: 'defaultAvatar',
                    life: 4,
                    attack: 4,
                    defense: 4,
                    speed: 4,
                    attackDice: 'D4',
                    defenseDice: 'D4',
                    movementPts: 4,
                    actions: 4,
                    wins: 0,
                    position: { x: 0, y: 0 },
                    spawnPosition: { x: 0, y: 0 },
                },
            };

            gateway.handleShareCharacter(client as Socket, updatedPayload);

            expect(roomService.shareCharacter).toHaveBeenCalledWith(
                payload.accessCode,
                expect.objectContaining({ id: payload.player.id, name: payload.player.name }),
            );
            expect(server.to).toHaveBeenCalledWith(payload.accessCode);
            expect(roomEmitMock).toHaveBeenCalledWith('playerJoined', { room });
        });

        it('should emit characterError when shareCharacter fails', () => {
            const payload = { accessCode: 'ROOM123', player: { id: 'player1', name: 'PlayerStats One' } };
            (roomService.shareCharacter as jest.Mock).mockReturnValue(null);

            const updatedPayload: { accessCode: string; player: PlayerStats } = {
                accessCode: payload.accessCode,
                player: {
                    id: payload.player.id,
                    name: payload.player.name,
                    avatar: 'defaultAvatar',
                    life: 4,
                    attack: 4,
                    defense: 4,
                    speed: 4,
                    attackDice: 'D4',
                    defenseDice: 'D4',
                    movementPts: 4,
                    actions: 4,
                    position: { x: 0, y: 0 },
                    spawnPosition: { x: 0, y: 0 },
                    wins: 0,
                },
            };

            gateway.handleShareCharacter(client as Socket, updatedPayload);

            expect(client.emit).toHaveBeenCalledWith('characterError', { message: 'Impossible de partager le personnage.' });
        });
    });

    describe('handleRemovePlayer', () => {
        it('should remove player successfully and emit playerRemoved', () => {
            const payload = { accessCode: 'ROOM123', playerId: 'player1' };
            const room = { players: [{ id: 'player1', name: 'PlayerStats One' }] };
            (roomService.removePlayer as jest.Mock).mockReturnValue(room);
            const roomEmitMock = jest.fn();
            (server.to as jest.Mock).mockReturnValue({ emit: roomEmitMock });

            gateway.handleRemovePlayer(client as Socket, payload);

            expect(roomService.removePlayer).toHaveBeenCalledWith(payload.accessCode, payload.playerId);
            expect(server.to).toHaveBeenCalledWith(payload.accessCode);
            expect(roomEmitMock).toHaveBeenCalledWith('playerRemoved', room.players);
        });

        it('should emit removeError when removePlayer fails', () => {
            const payload = { accessCode: 'ROOM123', playerId: 'player1' };
            (roomService.removePlayer as jest.Mock).mockReturnValue(null);

            gateway.handleRemovePlayer(client as Socket, payload);

            expect(client.emit).toHaveBeenCalledWith('removeError', { message: 'Impossible de supprimer le joueur.' });
        });
    });

    describe('handleDisconnectPlayer', () => {
        it('should disconnect player successfully and emit playerDisconnected', () => {
            const payload = { accessCode: 'ROOM123', playerId: 'player1' };
            const room = { players: [{ id: 'player1', name: 'PlayerStats One' }] };
            (roomService.disconnectPlayer as jest.Mock).mockReturnValue(room);
            const roomEmitMock = jest.fn();
            (server.to as jest.Mock).mockReturnValue({ emit: roomEmitMock });

            gateway.handleDisconnectPlayer(client as Socket, payload);

            expect(roomService.disconnectPlayer).toHaveBeenCalledWith(payload.accessCode, payload.playerId);
            expect(server.to).toHaveBeenCalledWith(payload.accessCode);
            expect(roomEmitMock).toHaveBeenCalledWith('playerDisconnected', room.players);
        });

        it('should emit disconnectError when disconnectPlayer fails', () => {
            const payload = { accessCode: 'ROOM123', playerId: 'player1' };
            (roomService.disconnectPlayer as jest.Mock).mockReturnValue(null);

            gateway.handleDisconnectPlayer(client as Socket, payload);

            expect(client.emit).toHaveBeenCalledWith('disconnectError', { message: 'Impossible de déconnecter le joueur.' });
        });
    });

    describe('Lifecycle hooks', () => {
        it('should log after initialization in afterInit', () => {
            const logSpy = jest.spyOn(gateway['logger'], 'log');
            const dummyServer = {} as any;
            gateway.afterInit(dummyServer);
            expect(logSpy).toHaveBeenCalled();
        });

        it('should emit welcome on connection', () => {
            const logSpy = jest.spyOn(gateway['logger'], 'log');
            gateway.handleConnection(client as Socket);
            expect(logSpy).toHaveBeenCalledWith(`Client connecté : ${client.id}`);
            expect(client.emit).toHaveBeenCalledWith('welcome', { message: 'Bienvenue sur le serveur de jeu !' });
        });

        it('should log on disconnect', () => {
            const logSpy = jest.spyOn(gateway['logger'], 'log');
            gateway.handleDisconnect(client as Socket);
            expect(logSpy).toHaveBeenCalledWith(`Client déconnecté : ${client.id}`);
        });
    });
});
