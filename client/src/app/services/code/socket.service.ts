import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Board } from '@common/board';
import { GameRoom } from '@common/game-room';
import { Player } from '@common/player';
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

    constructor(private router: Router) {
        this.socket = io(this.url);
        this.socket.on('redirectHome', () => {
            this.router.navigate(['/home']);
        });
    }

    onRoomCreated(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on('roomCreated', (data) => observer.next(data));
        });
    }

    createRoom(organizerId: string, size: number) {
        this.currentPlayerId = organizerId;
        this.size = size;
        this.socket.emit('createRoom', { organizerId, size });
    }

    joinRoom(accessCode: string) {
        this.socket.emit('joinRoom', { accessCode });
    }

    shareGameMap(board: Board) {
        this.socket.emit('shareGameMap', { board });
    }

    shareCharacter(accessCode: string, player: Player) {
        this.currentPlayerId = player.id;
        this.socket.emit('shareCharacter', { accessCode, player });
    }

    onPlayerJoined(): Observable<{ room: GameRoom }> {
        return new Observable((observer) => {
            this.socket.on('playerJoined', (room: { room: GameRoom }) => {
                this.gameRoom = room.room;
                observer.next(room);
            });
        });
    }

    lockRoom(accessCode: string) {
        this.socket.emit('lockRoom', { accessCode });
    }

    unlockRoom(accessCode: string) {
        this.socket.emit('unlockRoom', { accessCode });
    }

    removePlayer(accessCode: string, playerId: string) {
        this.socket.emit('removePlayer', { accessCode, playerId });
    }

    onPlayersList(): Observable<Player[]> {
        return new Observable((observer) => {
            this.socket.on('playersList', (players: Player[]) => observer.next(players));
        });
    }

    onPlayerRemoved(): Observable<Player[]> {
        return new Observable((observer) => {
            this.socket.on('playerRemoved', (players: Player[]) => observer.next(players));
        });
    }

    onPlayerDisconnected(): Observable<Player[]> {
        return new Observable((observer) => {
            this.socket.on('playerDisconnected', (players: Player[]) => observer.next(players));
        });
    }

    onJoinError(): Observable<{ message: string }> {
        return new Observable((observer) => {
            this.socket.on('joinError', (errorData: { message: string }) => {
                observer.next(errorData);
            });
        });
    }

    getCurrentPlayerId(): string {
        return this.currentPlayerId;
    }

    getGameSize(): number {
        return this.size;
    }

    disconnect(accessCode: string, playerId: string) {
        this.socket.emit('disconnectPlayer', { accessCode, playerId });
    }
}
