import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    private socket: Socket;
    private readonly url: string = 'http://ec2-15-223-119-251.ca-central-1.compute.amazonaws.com:3000';

    constructor() {
        this.socket = io(this.url);
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

    onPlayerJoined(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on('playerJoined', (data) => observer.next(data));
        });
    }
}
