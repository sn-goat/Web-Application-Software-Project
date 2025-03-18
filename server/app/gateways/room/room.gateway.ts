import { RoomService } from '@app/services/room.service';
import { Room } from '@common/game';
import { PlayerStats } from '@common/player';
import { RoomEvents } from '@common/room.gateway.events';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class RoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger(RoomGateway.name);

    constructor(
        private readonly roomService: RoomService,
        private readonly eventEmitter: EventEmitter2,
    ) {
        this.eventEmitter.on('room.deleted', (accessCode: string) => {
            this.handleRoomDeletion(accessCode);
        });
    }

    @SubscribeMessage(RoomEvents.CreateRoom)
    handleCreateRoom(client: Socket, payload: { organizerId: string; size: number }) {
        const room: Room = this.roomService.createRoom(payload.organizerId, payload.size);

        client.join(room.accessCode);
        client.emit(RoomEvents.RoomCreated, room);
        this.logger.log(`Salle de jeu créée avec le code ${room.accessCode}`);
    }

    @SubscribeMessage(RoomEvents.JoinRoom)
    handleJoinRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.roomService.joinRoom(payload.accessCode);
        if (!room) {
            client.emit(RoomEvents.JoinError, { message: "Impossible de rejoindre la salle. Elle est peut-être verrouillée ou n'existe pas." });
            return;
        }
        client.join(payload.accessCode);
        this.server.to(payload.accessCode).emit(RoomEvents.PlayerJoined, { room });
        this.server.to(payload.accessCode).emit(RoomEvents.PlayerList, room.players);
    }

    @SubscribeMessage(RoomEvents.LockRoom)
    handleLockRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.roomService.lockRoom(payload.accessCode);
        if (!room) {
            client.emit(RoomEvents.LockError, { message: 'Impossible de verrouiller la salle.' });
            return;
        }
        this.server.to(payload.accessCode).emit(RoomEvents.RoomLocked, { room });
    }

    @SubscribeMessage(RoomEvents.UnlockRoom)
    handleUnlockRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.roomService.unlockRoom(payload.accessCode);
        if (!room) {
            client.emit(RoomEvents.UnlockError, { message: 'Impossible de déverrouiller la salle.' });
            return;
        }
        this.server.to(payload.accessCode).emit(RoomEvents.RoomUnlocked, { room });
    }

    @SubscribeMessage(RoomEvents.ShareCharacter)
    handleShareCharacter(client: Socket, payload: { accessCode: string; player: PlayerStats }) {
        const room = this.roomService.shareCharacter(payload.accessCode, payload.player);
        if (!room) {
            client.emit(RoomEvents.CharacterError, { message: 'Impossible de partager le personnage.' });
            return;
        }
        this.server.to(payload.accessCode).emit(RoomEvents.PlayerJoined, { room });
        this.server.to(payload.accessCode).emit(RoomEvents.PlayerList, room.players);
    }

    @SubscribeMessage(RoomEvents.RemovePlayer)
    handleRemovePlayer(client: Socket, payload: { accessCode: string; playerId: string }) {
        const room = this.roomService.removePlayer(payload.accessCode, payload.playerId);
        if (!room) {
            client.emit(RoomEvents.RemoveError, { message: 'Impossible de supprimer le joueur.' });
            return;
        }
        this.server.to(payload.accessCode).emit(RoomEvents.PlayerRemoved, room.players);
        this.server.to(payload.accessCode).emit(RoomEvents.PlayerList, room.players);
    }

    @SubscribeMessage(RoomEvents.DisconnectPlayer)
    handleDisconnectPlayer(client: Socket, payload: { accessCode: string; playerId: string }) {
        // Vérifier si le joueur déconnecté est l'admin et émettre l'événement avant toute modification de la salle
        const currentRoom = this.roomService.getRoom(payload.accessCode);
        if (currentRoom && payload.playerId === currentRoom.organizerId) {
            this.server.to(payload.accessCode).emit(RoomEvents.AdminDisconnected);
        }

        const room = this.roomService.disconnectPlayer(payload.accessCode, payload.playerId);
        if (!room) {
            client.emit(RoomEvents.DisconnectError, { message: 'Impossible de déconnecter le joueur.' });
            return;
        }
        this.server.to(payload.accessCode).emit(RoomEvents.PlayerDisconnected, room.players);
        this.server.to(payload.accessCode).emit(RoomEvents.PlayerList, room.players);
    }

    @SubscribeMessage(RoomEvents.GetRoom)
    handleGetRoom(client: Socket, payload: { accessCode: string }) {
        const room = this.roomService.getRoom(payload.accessCode);
        if (!room) {
            client.emit(RoomEvents.RoomError, { message: 'Salle introuvable.' });
            return;
        }
        client.emit(RoomEvents.RoomData, room);
    }

    @SubscribeMessage(RoomEvents.QuitGame)
    handleQuitGame(client: Socket, payload: { accessCode: string; playerId: string }) {
        const lastPlayerId = this.roomService.quitGame(payload.accessCode, payload.playerId);
        this.logger.log(`LastPlayer ${lastPlayerId} quit game in room`);
        if (lastPlayerId) {
            this.logger.log(`LastPlayer ${lastPlayerId} send quit`);
            this.server.to(lastPlayerId).emit(RoomEvents.NotEnoughPlayer);
        }
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
    }

    private handleRoomDeletion(accessCode: string): void {
        this.logger.log(`Deleting sockets from room: ${accessCode}`);
        const roomSocket = this.server.sockets.adapter.rooms.get(accessCode);

        if (!roomSocket) {
            this.logger.warn(`Room ${accessCode} not found.`);
            return;
        }

        for (const clientId of roomSocket) {
            const clientSocket = this.server.sockets.sockets.get(clientId);
            if (clientSocket) {
                clientSocket.leave(accessCode);
                this.logger.log(`Client ${clientSocket.id} left room ${accessCode}`);

                // Déconnecter complètement le client
                clientSocket.disconnect(true);
                this.logger.log(`Client ${clientSocket.id} disconnected`);
            }
        }
    }
}
