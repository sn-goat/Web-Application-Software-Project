import { Injectable } from '@angular/core';
import { Board } from '@common/board';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    private socket: Socket;
    private readonly url: string = environment.serverUrl;

    constructor() {
        // This will allow us to mock this socket in tests
        this.socket = this.createSocket();
    }

    // For testing purposes only
    setSocket(socket: Socket): void {
        this.socket = socket;
    }

    onGameCreated(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on('gameCreated', (data) => observer.next(data));
        });
    }

    createGame(organizerId: string) {
        this.socket.emit('createGame', { organizerId });
    }

    joinGame(accessCode: string, player: unknown) {
        this.socket.emit('joinGame', { accessCode, player });
    }

    shareGameMap(board: Board) {
        this.socket.emit('shareGameMap', { board });
    }

    onPlayerJoined(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on('playerJoined', (data) => observer.next(data));
        });
    }

    // Added this protected method to make it easier to mock in tests
    protected createSocket(): Socket {
        return io(this.url);
    }
}
