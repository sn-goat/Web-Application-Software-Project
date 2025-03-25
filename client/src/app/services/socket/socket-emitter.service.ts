import { Injectable } from '@angular/core';
import { Cell } from '@common/board';
import { GameEvents } from '@common/game.gateway.events';
import { PlayerStats } from '@common/player';
import { RoomEvents } from '@common/room.gateway.events';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketEmitterService {
    private accessCode: string;
    private socket: Socket;
    private readonly url: string = environment.serverUrl;

    constructor() {
        this.socket = io(this.url);
    }

    setAccessCode(accessCode: string) {
        this.accessCode = accessCode;
    }

    getAccessCode(): string {
        return this.accessCode;
    }

    createRoom(map: Cell[][]) {
        this.socket.emit(RoomEvents.CreateRoom, map);
    }

    joinRoom() {
        this.socket.emit(RoomEvents.JoinRoom, this.accessCode);
        this.socket.emit(RoomEvents.GetRoom, this.accessCode);
    }

    shareCharacter(player: PlayerStats) {
        player.id = this.socket.id as string;
        this.socket.emit(RoomEvents.ShareCharacter, { accessCode: this.accessCode, player });
    }

    lockRoom() {
        this.socket.emit(RoomEvents.LockRoom, this.accessCode);
    }

    unlockRoom() {
        this.socket.emit(RoomEvents.UnlockRoom, this.accessCode);
    }

    removePlayer(playerId: string) {
        this.socket.emit(RoomEvents.RemovePlayer, { accessCode: this.accessCode, playerId });
    }

    startGame() {
        this.socket.emit(GameEvents.Start, this.accessCode);
    }
}
