import { RoomService } from '@app/services/room.service';
import { GameRoom } from '@common/game-room';
import { Player } from '@common/player';
import { RoomEvents } from '@common/room.gateway.events';
import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class RoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger(RoomGateway.name);

    constructor(private readonly roomService: RoomService) {}

    @SubscribeMessage(RoomEvents.CreateRoom)
    handleCreateRoom(client: Socket, payload: { organizerId: string; size: number }) {
        const room: GameRoom = this.roomService.createRoom(payload.organizerId, payload.size);

        client.join(room.accessCode);
        client.emit(RoomEvents.RoomCreated, room);
        this.logger.log(`gameRoom created with room code ${room.accessCode}`);
    }

    @SubscribeMessage(RoomEvents.JoinRoom)
    handleJoinRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.roomService.joinRoom(payload.accessCode);
        if (!room) {
            client.emit(RoomEvents.JoinError, { message: 'Unable to join room. It may be locked or does not exist.' });
            return;
        }
        client.join(payload.accessCode);
        this.server.to(payload.accessCode).emit(RoomEvents.PlayerJoined, { room });
    }

    @SubscribeMessage(RoomEvents.LockRoom)
    handleLockRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.roomService.lockRoom(payload.accessCode);
        if (!room) {
            client.emit(RoomEvents.LockError, { message: 'Unable to lock room.' });
            return;
        }
        this.server.to(payload.accessCode).emit(RoomEvents.RoomLocked, { room });
    }

    @SubscribeMessage(RoomEvents.UnlockRoom)
    handleUnlockRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.roomService.unlockRoom(payload.accessCode);
        if (!room) {
            client.emit(RoomEvents.UnlockError, { message: 'Unable to unlock room.' });
            return;
        }
        this.server.to(payload.accessCode).emit(RoomEvents.RoomUnlocked, { room });
    }

    @SubscribeMessage(RoomEvents.ShareCharacter)
    handleShareCharacter(client: Socket, payload: { accessCode: string; player: Player }) {
        const room = this.roomService.shareCharacter(payload.accessCode, payload.player);
        if (!room) {
            client.emit(RoomEvents.CharacterError, { message: 'Unable to share character.' });
            return;
        }

        this.server.to(payload.accessCode).emit(RoomEvents.PlayerJoined, { room });
    }

    @SubscribeMessage(RoomEvents.RemovePlayer)
    handleRemovePlayer(client: Socket, payload: { accessCode: string; playerId: string }) {
        const room = this.roomService.removePlayer(payload.accessCode, payload.playerId);
        if (!room) {
            client.emit(RoomEvents.RemoveError, { message: 'Unable to remove player.' });
            return;
        }
        this.server.to(payload.accessCode).emit(RoomEvents.PlayerRemoved, room.players);
    }

    @SubscribeMessage(RoomEvents.DisconnectPlayer)
    handleDisconnectPlayer(client: Socket, payload: { accessCode: string; playerId: string }) {
        const room = this.roomService.disconnectPlayer(payload.accessCode, payload.playerId);
        if (!room) {
            client.emit(RoomEvents.DisconnectError, { message: 'Unable to disconnect player.' });
            return;
        }
        this.server.to(payload.accessCode).emit(RoomEvents.PlayerDisconnected, room.players);
    }

    @SubscribeMessage(RoomEvents.GetRoom)
    handleGetRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.roomService.getRoom(payload.accessCode);
        if (!room) {
            client.emit(RoomEvents.RoomError, { message: 'Room not found.' });
            return;
        }
        client.emit(RoomEvents.RoomData, room);
    }

    afterInit(server: Server) {
        this.logger.log('GameGateway Initialized' + server);
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        client.emit(RoomEvents.Welcome, { message: 'Welcome to the game server!' });
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
}
