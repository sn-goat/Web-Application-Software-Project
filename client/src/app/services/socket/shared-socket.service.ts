import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SharedSocketService {
    socket: Socket;
    constructor() {
        this.socket = io(environment.serverUrl);
        this.socket.on('disconnect', () => {
            this.socket.connect();
        });
    }
}
