import { GameManagerService } from '@app/services/game/games-manager.service';
import { ChatMessage } from '@common/chat';
import { ChatEvents } from '@common/chat.gateway.events';
import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() private server: Server;
    private readonly logger = new Logger(ChatGateway.name);

    constructor(private readonly gameManagerService: GameManagerService) {}

    @SubscribeMessage(ChatEvents.RoomMessage)
    roomMessage(socket: Socket, message: ChatMessage) {
        const myRoom = this.gameManagerService.getRoom(message.accessCode);
        myRoom.addMessage(message);
        socket.broadcast.to(message.accessCode).emit(ChatEvents.RoomMessage, message);
        this.logger.log(`Message envoyé par ${socket.id} : ${message.message}`);
    }

    handleConnection(socket: Socket) {
        this.logger.log(`Connexion par l'utilisateur avec id : ${socket.id}`);
        socket.emit(ChatEvents.Hello, 'Hello World!');
    }

    handleDisconnect(socket: Socket) {
        this.logger.log(`Déconnexion par l'utilisateur avec id : ${socket.id}`);
    }
}
