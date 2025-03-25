import { Injectable } from '@angular/core';
import { RoomEvents } from '@common/room.gateway.events';
import { GameEvents } from '@common/game.gateway.events';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { SocketEmitterService } from './socket-emitter.service';
import { IRoom, IGame } from '@common/game';
import { IPlayer } from '@common/player';

@Injectable({
    providedIn: 'root',
})
export class SocketReceiverService {
    private socket: Socket;
    private readonly url: string = environment.serverUrl;
    private socketEmitter: SocketEmitterService;

    constructor() {
        this.socket = io(this.url);
    }

    onRoomCreated(): Observable<IRoom> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.RoomCreated, (room: IRoom) => {
                this.socketEmitter.setAccessCode(room.accessCode);
                observer.next(room);
            });
        });
    }

    onPlayerJoined(): Observable<IRoom> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.PlayerJoined, (room: IRoom) => {
                observer.next(room);
            });
        });
    }

    onPlayerRemoved(): Observable<IPlayer[]> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.PlayerRemoved, (players: IPlayer[]) => {
                observer.next(players);
            });
        });
    }

    onPlayerDisconnected(): Observable<IPlayer[]> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.PlayerDisconnected, (players: IPlayer[]) => {
                observer.next(players);
            });
        });
    }

    onRoomLocked(): Observable<void> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.RoomLocked, (data) => observer.next(data));
        });
    }

    onRoomUnLocked(): Observable<void> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.RoomUnlocked, (data) => observer.next(data));
        });
    }

    onAdminDisconnected(): Observable<void> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.AdminDisconnected, (data) => observer.next(data));
        });
    }

    onBroadcastStartGame(): Observable<IGame> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.BroadcastStartGame, (game: IGame) => observer.next(game));
        });
    }
}
