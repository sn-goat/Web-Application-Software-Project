import { Injectable } from '@angular/core';
import { SharedSocketService } from '@app/services/socket/shared-socket.service';
import { Vec2 } from '@common/board';
import { Item } from '@common/enums';
import { PathInfo } from '@common/game';
import { FightEvents, GameEvents, TurnEvents } from '@common/game.gateway.events';
import { PlayerInput } from '@common/player';
import { RoomEvents } from '@common/room.gateway.events';

@Injectable({
    providedIn: 'root',
})
export class SocketEmitterService {
    private accessCode: string;
    private socket = this.sharedSocketService.socket;

    constructor(private sharedSocketService: SharedSocketService) {}

    getAccessCode() {
        return this.accessCode;
    }

    setAccessCode(accessCode: string) {
        this.accessCode = accessCode;
    }

    createRoom(mapName: string) {
        this.socket.emit(RoomEvents.CreateRoom, mapName);
    }

    joinRoom(accessCode: string) {
        this.setAccessCode(accessCode);
        this.socket.emit(RoomEvents.JoinRoom, accessCode);
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

    expelPlayer(playerId: string) {
        this.socket.emit(RoomEvents.ExpelPlayer, { accessCode: this.accessCode, playerId });
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

    debugMove(direction: Vec2, playerId: string) {
        this.socket.emit(TurnEvents.DebugMove, { accessCode: this.accessCode, direction, playerId });
    }

    endTurn() {
        this.socket.emit(TurnEvents.End, this.accessCode);
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

    inventoryChoice(payload: { playerId: string, itemToThrow: Item, itemToAdd: Item, position: Vec2, accessCode: string }): void {
        this.socket.emit(TurnEvents.InventoryChoice, payload);
    }
}
