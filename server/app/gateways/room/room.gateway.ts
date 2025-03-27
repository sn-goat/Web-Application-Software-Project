import { GameManagerService } from '@app/services/game/games-manager.service';
import { Cell } from '@common/board';
import { Room } from '@app/class/room';
import { PlayerInput } from '@common/player';
import { RoomEvents } from '@common/room.gateway.events';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Player } from '@app/class/player';
import { InternalRoomEvents } from '@app/constants/internal-events';

@WebSocketGateway({ cors: true })
@Injectable()
export class RoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger(RoomGateway.name);

    constructor(
        private readonly gameManager: GameManagerService,
        private readonly eventEmitter: EventEmitter2,
    ) {}
    @OnEvent(InternalRoomEvents.CloseRoom)
    handleClosingRoom(accessCode: string): void {
        this.gameManager.closeRoom(accessCode);
    }

    @OnEvent(InternalRoomEvents.PlayerRemoved)
    handlePlayerRemoved(payload: { accessCode: string; playerId: string; message: string }): void {
        this.server.to(payload.playerId).emit(RoomEvents.PlayerRemoved, payload.message);
        const clientSock: Socket = this.server.sockets.sockets.get(payload.playerId);
        clientSock.leave(payload.accessCode);
    }

    @SubscribeMessage(RoomEvents.CreateRoom)
    handleCreateRoom(client: Socket, map: Cell[][]) {
        const room: Room = this.gameManager.openRoom(client.id, map);
        client.join(room.accessCode);
        client.emit(RoomEvents.RoomCreated, room);
        this.logger.log(`Salle de jeu créée avec le code ${room.accessCode}`);
    }

    @SubscribeMessage(RoomEvents.JoinRoom)
    handleJoinRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.gameManager.getRoom(payload.accessCode);
        if (room === undefined) {
            client.emit(RoomEvents.JoinError, "Impossible de rejoindre la salle, car elle n'existe pas.");
        } else if (room.isLocked) {
            client.emit(RoomEvents.JoinError, 'Impossible de rejoindre la salle, car elle est verrouillée.');
        } else {
            client.join(payload.accessCode);
            this.server.to(payload.accessCode).emit(RoomEvents.PlayerJoined, room);
        }
    }

    @SubscribeMessage(RoomEvents.LockRoom)
    handleLockRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.gameManager.getRoom(payload.accessCode);
        room.setLock(true);
        this.server.to(payload.accessCode).emit(RoomEvents.RoomLocked);
    }

    @SubscribeMessage(RoomEvents.UnlockRoom)
    handleUnlockRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.gameManager.getRoom(payload.accessCode);
        room.setLock(false);
        this.server.to(payload.accessCode).emit(RoomEvents.RoomUnlocked);
    }

    @SubscribeMessage(RoomEvents.ShareCharacter)
    handleShareCharacter(client: Socket, payload: { accessCode: string; player: PlayerInput }) {
        const player = new Player(client.id, payload.player);
        const room = this.gameManager.getRoom(payload.accessCode);
        room.addPlayer(player);
        client.emit(RoomEvents.SetCharacter, player);
        this.server.to(payload.accessCode).emit(RoomEvents.PlayerJoined, room);
    }

    @SubscribeMessage(RoomEvents.ExpelPlayer)
    handleRemovePlayer(client: Socket, payload: { accessCode: string; playerId: string }) {
        const room = this.gameManager.getRoom(payload.accessCode);
        room.expelPlayer(payload.playerId);
    }

    @SubscribeMessage(RoomEvents.DisconnectPlayer)
    handleDisconnectPlayer(client: Socket, payload: { accessCode: string; playerId: string }) {
        const room = this.gameManager.getRoom(payload.accessCode);
        room.removePlayer(payload.playerId);
    }

    afterInit(server: Server) {
        this.logger.log('RoomGateway initialisé' + server);
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connecté : ${client.id}`);
        client.emit(RoomEvents.Welcome, { message: 'Bienvenue sur le serveur de jeu !' });
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client déconnecté : ${client.id}`);
        client.rooms.forEach((room) => {
            const gameRoom = this.gameManager.getRoom(room);
            gameRoom.removePlayer(client.id);
        });
    }
}
