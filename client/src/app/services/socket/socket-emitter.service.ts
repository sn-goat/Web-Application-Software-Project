import { Injectable } from '@angular/core';
import { Cell, Vec2 } from '@common/board';
import { PathInfo } from '@common/game';
import { FightEvents, GameEvents, TurnEvents } from '@common/game.gateway.events';
import { PlayerInput } from '@common/player';
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

    shareCharacter(player: PlayerInput) {
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

    disconnect(playerId: string) {
        this.socket.emit(RoomEvents.DisconnectPlayer, { accessCode: this.accessCode, playerId });
    }

    startGame() {
        this.socket.emit(GameEvents.Start, this.accessCode);
    }

    ready(playerId: string) {
        this.socket.emit(GameEvents.Ready, { accessCode: this.accessCode, playerId });
    }

    toggleDebug() {
        this.socket.emit(GameEvents.Debug, this.accessCode);
    }

    movePlayer(path: PathInfo, playerId: string) {
        this.socket.emit(TurnEvents.Move, { accessCode: this.accessCode, path, playerId });
    }

    changeDoorState(doorPosition: Vec2, playerId: string) {
        this.socket.emit(TurnEvents.ChangeDoorState, { accessCode: this.accessCode, doorPosition, playerId });
    }

    initFight(playerInitiatorId: string, playerDefenderId: string) {
        this.socket.emit(FightEvents.Init, { accessCode: this.accessCode, playerInitiatorId, playerDefenderId });
    }

    flee() {
        this.socket.emit(FightEvents.Flee, this.accessCode);
    }

    attack() {
        this.socket.emit(FightEvents.Attack, this.accessCode);
    }
}
