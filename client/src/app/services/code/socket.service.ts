import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;
  private readonly url: string = 'http://localhost:3000';

  constructor() {
    this.socket = io(this.url);
  }

  onGameCreated(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('gameCreated', (data) => observer.next(data));
    });
  }

  createGame(organizerId: string) {
    this.socket.emit('createGame', { organizerId });
  }

  joinGame(accessCode: string, player: any) {
    this.socket.emit('joinGame', { accessCode, player });
  }

  onPlayerJoined(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('playerJoined', (data) => observer.next(data));
    });
  }
}
