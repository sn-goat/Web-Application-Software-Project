import { Injectable } from '@angular/core';
import { Board } from '@common/board';
import { GameRoom } from '@common/game-room';
import { PlayerStats } from '@common/player';
import { RoomEvents } from '@common/room.gateway.events';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    gameRoom: GameRoom;
    private socket: Socket;
    private readonly url: string = environment.serverUrl;
    private currentPlayerId: string = '';
    private size: number = 0;

    constructor() {
        this.socket = io(this.url);
    }

    onRoomCreated(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.RoomCreated, (data) => {
                this.gameRoom = data as GameRoom; // Mettre à jour les données de la partie
                observer.next(data);
            });
        });
    }

    createRoom(organizerId: string, size: number) {
        this.currentPlayerId = organizerId;
        this.size = size;
        this.socket.emit(RoomEvents.CreateRoom, { organizerId, size });
    }

    joinRoom(accessCode: string) {
        this.socket.emit(RoomEvents.JoinRoom, { accessCode });
    }

    shareGameMap(board: Board) {
        this.socket.emit('shareGameMap', { board });
    }

    shareCharacter(accessCode: string, player: PlayerStats) {
        this.currentPlayerId = player.id;
        this.socket.emit(RoomEvents.ShareCharacter, { accessCode, player });
    }

    onPlayerJoined(): Observable<{ room: GameRoom }> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.PlayerJoined, (room: { room: GameRoom }) => {
                this.gameRoom = room.room;
                observer.next(room);
            });
        });
    }

    lockRoom(accessCode: string) {
        this.socket.emit(RoomEvents.LockRoom, { accessCode });
    }

    unlockRoom(accessCode: string) {
        this.socket.emit(RoomEvents.UnlockRoom, { accessCode });
    }

    removePlayer(accessCode: string, playerId: string) {
        this.socket.emit(RoomEvents.RemovePlayer, { accessCode, playerId });
    }

    onPlayersList(): Observable<PlayerStats[]> {
        return new Observable((observer) => {
            this.socket.on('playersList', (players: PlayerStats[]) => observer.next(players));
        });
    }

    onPlayerRemoved(): Observable<PlayerStats[]> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.PlayerRemoved, (players: PlayerStats[]) => observer.next(players));
        });
    }

    onPlayerDisconnected(): Observable<PlayerStats[]> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.PlayerDisconnected, (players: PlayerStats[]) => observer.next(players));
        });
    }

    onJoinError(): Observable<{ message: string }> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.JoinError, (errorData: { message: string }) => {
                observer.next(errorData);
            });
        });
    }

    onRoomLocked(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.RoomLocked, (data) => observer.next(data));
        });
    }

    getCurrentPlayerId(): string {
        return this.currentPlayerId;
    }

    getGameSize(): number {
        return this.size;
    }

    disconnect(accessCode: string, playerId: string) {
        this.socket.emit(RoomEvents.DisconnectPlayer, { accessCode, playerId });
    }
}
