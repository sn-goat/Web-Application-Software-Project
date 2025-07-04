import { Player } from '@app/class/player';
import { Room } from '@app/class/room';
import { InternalRoomEvents } from '@app/constants/internal-events';
import { GameManagerService } from '@app/services/game/games-manager.service';
import { GameEvents } from '@common/game.gateway.events';
import {
    CreateVirtualPlayerPayload,
    DisconnectPlayerPayload,
    RemovePlayerPayload,
    ShareCharacterPayload,
    UpdatePlayersPayload,
} from '@common/payload';
import { RoomEvents } from '@common/room.gateway.events';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class RoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger(RoomGateway.name);

    constructor(private readonly gameManager: GameManagerService) {}

    @OnEvent(InternalRoomEvents.CloseRoom)
    handleClosingRoom(accessCode: string): void {
        this.server.to(accessCode).emit(GameEvents.GameEnded);
        this.gameManager.closeRoom(accessCode);
    }

    @OnEvent(InternalRoomEvents.PlayerRemoved)
    handlePlayerRemoved(accessCode: string, playerId: string, message: string): void {
        this.server.to(playerId).emit(RoomEvents.PlayerRemoved, message);
        this.logger.log(`Joueur ${playerId} a été expulsé de la salle ${accessCode}`);
        const clientSock: Socket = this.server.sockets.sockets.get(playerId);
        if (clientSock) {
            clientSock.leave(accessCode);
        }
    }

    @OnEvent(InternalRoomEvents.PlayersUpdated)
    handleUpdatePlayers(payload: UpdatePlayersPayload): void {
        this.server.to(payload.accessCode).emit(RoomEvents.PlayersUpdated, payload.players);
    }

    @SubscribeMessage(RoomEvents.CreateRoom)
    async handleCreateRoom(client: Socket, mapName: string) {
        const room: Room = await this.gameManager.openRoom(client.id, mapName);
        client.join(room.accessCode);
        client.emit(RoomEvents.RoomCreated, room);
        this.logger.log(`Salle de jeu créée avec le code ${room.accessCode}`);
    }

    @SubscribeMessage(RoomEvents.JoinRoom)
    handleJoinRoom(client: Socket, accessCode: string) {
        const room = this.gameManager.getRoom(accessCode);
        this.logger.log(`Joueur ${client.id} veut rejoint la salle ${accessCode}`);
        if (room === undefined) {
            client.emit(RoomEvents.JoinError, "Impossible de rejoindre la salle, car elle n'existe pas.");
        } else if (room.isLocked) {
            client.emit(RoomEvents.JoinError, 'Impossible de rejoindre la salle, car elle est verrouillée.');
        } else {
            client.join(accessCode);
        }
        client.emit(RoomEvents.PlayerJoined, room);
    }

    @SubscribeMessage(RoomEvents.ShareCharacter)
    handleShareCharacter(client: Socket, payload: ShareCharacterPayload) {
        const player = new Player(client.id, payload.player);
        const room: Room = this.gameManager.getRoom(payload.accessCode);
        const avatars = room.addPlayer(player);
        if (!avatars) {
            client.emit(RoomEvents.SetCharacter, player);
            client.emit(RoomEvents.JoinSuccess, room);
            this.server.to(payload.accessCode).emit(RoomEvents.PlayerJoined, room);
        } else {
            this.logger.log('Avatar already taken');
            client.emit(RoomEvents.AvatarError, avatars);
        }
    }

    @SubscribeMessage(RoomEvents.CreateVirtualPlayer)
    handleCreateVirtualPlayer(client: Socket, payload: CreateVirtualPlayerPayload) {
        const room: Room = this.gameManager.getRoom(payload.accessCode);
        room.addVirtualPlayer(payload.playerStyle);
        this.server.to(payload.accessCode).emit(RoomEvents.PlayerJoined, room);
    }

    @SubscribeMessage(RoomEvents.LockRoom)
    handleLockRoom(client: Socket, accessCode: string) {
        const room = this.gameManager.getRoom(accessCode);
        room.setLock(true);
        this.server.to(accessCode).emit(RoomEvents.RoomLocked);
    }

    @SubscribeMessage(RoomEvents.UnlockRoom)
    handleUnlockRoom(client: Socket, accessCode: string) {
        const room = this.gameManager.getRoom(accessCode);
        room.setLock(false);
        this.server.to(accessCode).emit(RoomEvents.RoomUnlocked);
    }

    @SubscribeMessage(RoomEvents.ExpelPlayer)
    handleRemovePlayer(client: Socket, payload: RemovePlayerPayload) {
        const room = this.gameManager.getRoom(payload.accessCode);
        room.expelPlayer(payload.playerId);
    }

    @SubscribeMessage(RoomEvents.DisconnectPlayer)
    handleDisconnectPlayer(client: Socket, payload: DisconnectPlayerPayload) {
        const room = this.gameManager.getRoom(payload.accessCode);
        if (room) {
            room.removePlayer(payload.playerId);
        }
    }

    afterInit(server: Server) {
        this.logger.log('RoomGateway initialisé ' + server);
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connecté : ${client.id}`);
        client.emit(RoomEvents.Welcome, { message: 'Bienvenue sur le serveur de jeu !' });
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client déconnecté : ${client.id}`);
        client.rooms.forEach((room) => {
            const gameRoom = this.gameManager.getRoom(room);
            if (gameRoom) {
                gameRoom.removePlayer(client.id);
            }
        });
    }
}
