import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameRoom, GameService, Player } from './game.service';

@WebSocketGateway({ cors: true })
@Injectable()
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger(GameGateway.name);

    constructor(private readonly gameService: GameService) {}

    @SubscribeMessage('createGame')
    handleCreateGame(client: Socket, payload: { organizerId: string }) {
        const room: GameRoom = this.gameService.createGame(payload.organizerId);

        client.join(room.accessCode);
        client.emit('gameCreated', room);
        this.logger.log(`Game created with room code ${room.accessCode}`);
    }

    @SubscribeMessage('joinGame')
    handleJoinGame(client: Socket, payload: { accessCode: string; player: Player }) {
        const room = this.gameService.joinGame(payload.accessCode, payload.player);
        if (!room) {
            client.emit('joinError', { message: 'Unable to join room. It may be locked or does not exist.' });
            return;
        }
        client.join(payload.accessCode);
        this.server.to(payload.accessCode).emit('playerJoined', { player: payload.player, room });
    }

    @SubscribeMessage('lockRoom')
    handleLockRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.gameService.lockRoom(payload.accessCode);
        if (!room) {
            client.emit('lockError', { message: 'Unable to lock room.' });
            return;
        }
        this.server.to(payload.accessCode).emit('roomLocked', { room });
    }

    @SubscribeMessage('unlockRoom')
    handleUnlockRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.gameService.unlockRoom(payload.accessCode);
        if (!room) {
            client.emit('unlockError', { message: 'Unable to unlock room.' });
            return;
        }
        this.server.to(payload.accessCode).emit('roomUnlocked', { room });
    }

    @SubscribeMessage('startGame')
    handleStartGame(client: Socket, payload: { accessCode: string }) {
        const room = this.gameService.startGame(payload.accessCode);
        if (!room) {
            client.emit('startError', { message: 'Unable to start game. Make sure the room is locked and valid.' });
            return;
        }
        this.server.to(payload.accessCode).emit('gameStarted', { room });
    }

    @SubscribeMessage('submitMove')
    handleSubmitMove(client: Socket, payload: { accessCode: string; playerId: string; move: string }) {
        const room = this.gameService.submitMove(payload.accessCode, payload.playerId, payload.move);
        if (!room) {
            client.emit('moveError', { message: 'Unable to submit move.' });
            return;
        }
        this.server.to(payload.accessCode).emit('moveSubmitted', { room, playerId: payload.playerId });
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
