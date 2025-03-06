import { GameRoom } from '@common/game-room';
import { Player } from '@common/player';
import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
@WebSocketGateway({ cors: true })
@Injectable()
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger(GameGateway.name);

    constructor(private readonly roomService: RoomService) {}

    @SubscribeMessage('createRoom')
    handleCreateRoom(client: Socket, payload: { organizerId: string; size: number }) {
        const room: GameRoom = this.roomService.createRoom(payload.organizerId, payload.size);

        client.join(room.accessCode);
        client.emit('roomCreated', room);
        this.logger.log(`gameRoom created with room code ${room.accessCode}`);
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.roomService.joinRoom(payload.accessCode);
        if (!room) {
            client.emit('joinError', { message: 'Unable to join room. It may be locked or does not exist.' });
            return;
        }
        client.join(payload.accessCode);
        this.server.to(payload.accessCode).emit('playerJoined', { room });
    }

    @SubscribeMessage('lockRoom')
    handleLockRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.roomService.lockRoom(payload.accessCode);
        if (!room) {
            client.emit('lockError', { message: 'Unable to lock room.' });
            return;
        }
        this.server.to(payload.accessCode).emit('roomLocked', { room });
    }

    @SubscribeMessage('unlockRoom')
    handleUnlockRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.roomService.unlockRoom(payload.accessCode);
        if (!room) {
            client.emit('unlockError', { message: 'Unable to unlock room.' });
            return;
        }
        this.server.to(payload.accessCode).emit('roomUnlocked', { room });
    }

    @SubscribeMessage('shareCharacter')
    handleShareCharacter(client: Socket, payload: { accessCode: string; player: Player }) {
        const room = this.roomService.shareCharacter(payload.accessCode, payload.player);
        if (!room) {
            client.emit('characterError', { message: 'Unable to share character.' });
            return;
        }

        this.server.to(payload.accessCode).emit('playerJoined', { room });
    }

    @SubscribeMessage('removePlayer')
    handleRemovePlayer(client: Socket, payload: { accessCode: string; playerId: string }) {
        const room = this.roomService.removePlayer(payload.accessCode, payload.playerId);
        if (!room) {
            client.emit('removeError', { message: 'Unable to remove player.' });
            return;
        }
        this.server.to(payload.accessCode).emit('playerRemoved', room.players);
    }

    @SubscribeMessage('disconnectPlayer')
    handleDisconnectPlayer(client: Socket, payload: { accessCode: string; playerId: string }) {
        const room = this.roomService.disconnectPlayer(payload.accessCode, payload.playerId);
        if (!room) {
            client.emit('disconnectError', { message: 'Unable to disconnect player.' });
            return;
        }
        this.server.to(payload.accessCode).emit('playerDisconnected', room.players);
    }

    @SubscribeMessage('getRoom')
    handleGetRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.roomService.getRoom(payload.accessCode);
        if (!room) {
            client.emit('roomError', { message: 'Room not found.' });
            return;
        }
        client.emit('roomData', room);
    }

    afterInit(server: Server) {
        this.logger.log('GameGateway Initialized' + server);
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        client.emit('welcome', { message: 'Welcome to the game server!' });
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
}
