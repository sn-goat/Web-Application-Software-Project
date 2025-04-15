import { Injectable, inject } from '@angular/core';
import { SharedSocketService } from '@app/services/socket/shared-socket.service';
import { Vec2 } from '@common/board';
import { ChatMessage } from '@common/chat';
import { ChatEvents } from '@common/chat.gateway.events';
import { PathInfo } from '@common/game';
import { FightEvents, GameEvents, TurnEvents } from '@common/game.gateway.events';
import {
    ChangeDoorStatePayload,
    CreateVirtualPlayerPayload,
    DebugMovePayload,
    DisconnectPlayerPayload,
    FightInitPayload,
    InventoryChoicePayload,
    PlayerMovementPayload,
    ReadyPayload,
    RemovePlayerPayload,
    ShareCharacterPayload,
} from '@common/payload';
import { PlayerInput, VirtualPlayerStyles } from '@common/player';
import { RoomEvents } from '@common/room.gateway.events';

@Injectable({
    providedIn: 'root',
})
export class SocketEmitterService {
    private sharedSocketService = inject(SharedSocketService);

    private accessCode: string;
    private socket = this.sharedSocketService.socket;

    getAccessCode(): string {
        return this.accessCode;
    }

    setAccessCode(accessCode: string): void {
        this.accessCode = accessCode;
    }

    createRoom(mapName: string): void {
        this.socket.emit(RoomEvents.CreateRoom, mapName);
    }

    joinRoom(accessCode: string): void {
        this.setAccessCode(accessCode);
        this.socket.emit(RoomEvents.JoinRoom, accessCode);
    }

    shareCharacter(player: PlayerInput): void {
        const payload: ShareCharacterPayload = { accessCode: this.accessCode, player };
        this.socket.emit(RoomEvents.ShareCharacter, payload);
    }

    createVirtualPlayer(playerStyle: VirtualPlayerStyles): void {
        const payload: CreateVirtualPlayerPayload = { accessCode: this.accessCode, playerStyle };
        this.socket.emit(RoomEvents.CreateVirtualPlayer, payload);
    }

    lockRoom(): void {
        this.socket.emit(RoomEvents.LockRoom, this.accessCode);
    }

    unlockRoom(): void {
        this.socket.emit(RoomEvents.UnlockRoom, this.accessCode);
    }

    expelPlayer(playerId: string): void {
        const payload: RemovePlayerPayload = { accessCode: this.accessCode, playerId };
        this.socket.emit(RoomEvents.ExpelPlayer, payload);
    }

    disconnect(playerId: string): void {
        const payload: DisconnectPlayerPayload = { accessCode: this.accessCode, playerId };
        this.socket.emit(RoomEvents.DisconnectPlayer, payload);
    }

    startGame(): void {
        this.socket.emit(GameEvents.Start, this.accessCode);
    }

    ready(playerId: string): void {
        const payload: ReadyPayload = { accessCode: this.accessCode, playerId };
        this.socket.emit(GameEvents.Ready, payload);
    }

    toggleDebug(): void {
        this.socket.emit(GameEvents.Debug, this.accessCode);
    }

    movePlayer(path: PathInfo, playerId: string): void {
        const payload: PlayerMovementPayload = { accessCode: this.accessCode, path, playerId };
        this.socket.emit(TurnEvents.Move, payload);
    }

    debugMove(direction: Vec2, playerId: string): void {
        const payload: DebugMovePayload = { accessCode: this.accessCode, direction, playerId };
        this.socket.emit(TurnEvents.DebugMove, payload);
    }

    endTurn(): void {
        this.socket.emit(TurnEvents.End, this.accessCode);
    }

    changeDoorState(doorPosition: Vec2, playerId: string): void {
        const payload: ChangeDoorStatePayload = { accessCode: this.accessCode, doorPosition, playerId };
        this.socket.emit(TurnEvents.ChangeDoorState, payload);
    }

    initFight(playerInitiatorId: string, playerDefenderId: string): void {
        const payload: FightInitPayload = { accessCode: this.accessCode, playerInitiatorId, playerDefenderId };
        this.socket.emit(FightEvents.Init, payload);
    }

    flee(): void {
        this.socket.emit(FightEvents.Flee, this.accessCode);
    }

    attack(): void {
        this.socket.emit(FightEvents.Attack, this.accessCode);
    }

    inventoryChoice(payload: InventoryChoicePayload): void {
        this.socket.emit(TurnEvents.InventoryChoice, payload);
    }

    sendMessageToServer(message: ChatMessage): void {
        this.socket.emit(ChatEvents.RoomMessage, message);
    }
}
