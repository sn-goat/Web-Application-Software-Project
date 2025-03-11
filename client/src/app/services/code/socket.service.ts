import { Injectable } from '@angular/core';
import { Vec2 } from '@common/board';
import { Game, PathInfo, Room, TurnInfo } from '@common/game';
import { FightEvents, GameEvents, TurnEvents } from '@common/game.gateway.events';
import { PlayerStats } from '@common/player';
import { RoomEvents } from '@common/room.gateway.events';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    gameRoom: Room;
    private socket: Socket;
    private readonly url: string = environment.serverUrl;
    private currenPlayer: PlayerStats;
    private size: number = 0;

    constructor() {
        this.socket = io(this.url);
    }

    onRoomCreated(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.RoomCreated, (data) => {
                this.gameRoom = data as Room; // Mettre à jour les données de la partie
                observer.next(data);
            });
        });
    }

    createRoom(size: number) {
        this.size = size;
        this.socket.emit(RoomEvents.CreateRoom, { organizerId: this.socket.id, size });
    }

    joinRoom(accessCode: string) {
        this.socket.emit(RoomEvents.JoinRoom, { accessCode });
    }

    shareCharacter(accessCode: string, player: PlayerStats) {
        player.id = this.socket.id as string;
        this.currenPlayer = player;
        this.socket.emit(RoomEvents.ShareCharacter, { accessCode, player });
    }

    onPlayerJoined(): Observable<{ room: Room }> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.PlayerJoined, (room: { room: Room }) => {
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
            this.socket.on(RoomEvents.PlayerList, (players: PlayerStats[]) => observer.next(players));
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

    // Game events
    // Send
    createGame(accessCode: string, mapName: string, organizerId: string) {
        this.socket.emit(GameEvents.Create, { accessCode, mapName, organizerId });
    }

    configureGame(accessCode: string, players: PlayerStats[]) {
        this.socket.emit(GameEvents.Configure, { accessCode, players });
    }

    readyUp(accessCode: string, playerId: string) {
        this.socket.emit(GameEvents.Ready, { accessCode, playerId });
    }

    movePlayer(accessCode: string, path: Vec2[]) {
        this.socket.emit(TurnEvents.Move, { accessCode, path });
    }

    changeDoorState(accessCode: string, position: Vec2) {
        this.socket.emit(TurnEvents.ChangeDoorState, { accessCode, position });
    }

    // Faudrait créer une room spécifique pour gérer les events du fight elle sera supprimée à la fin du fight
    initFight(accessCode: string, playerId: string, enemyPosition: Vec2) {
        this.socket.emit(FightEvents.Init, { accessCode, playerId, enemyPosition });
    }

    // Assembler les deux fonctions suivantes en une seule en donnant un  type d'action de combat qui sera géré back
    playerFlee(accessCode: string, playerId: string) {
        this.socket.emit(FightEvents.Flee, { accessCode, playerId });
    }

    playerAttack(accessCode: string, playerId: string) {
        this.socket.emit(FightEvents.Attack, { accessCode, playerId });
    }

    endTurn(accessCode: string) {
        this.socket.emit(TurnEvents.End, accessCode);
    }

    // Receive
    onBroadcastStartGame(): Observable<Game> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.BroadcastStartGame, (game: Game) => observer.next(game));
        });
    }

    onBroadcastDebugState(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.BroadcastDebugState, (data) => observer.next(data));
        });
    }

    onTimerUpdate(): Observable<{ remainingTime: number }> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.UpdateTimer, (data: { remainingTime: number }) => {
                observer.next(data);
            });
        });
    }

    onTurnUpdate(): Observable<TurnInfo> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.PlayerTurn, (turn: { player: PlayerStats; path: Record<string, PathInfo> }) => {
                const receivedMap = new Map(Object.entries(turn.path));
                observer.next({ player: turn.player, path: receivedMap });
            });
            this.socket.on(TurnEvents.PlayerTurn, (data: { turn: TurnInfo }) => observer.next(data.turn));
        });
    }

    onEndTurn(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.End, (data) => observer.next(data));
        });
    }

    onFullInventory(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.FullInventory, (data) => observer.next(data));
        });
    }

    onBroadcastEnd(): Observable<TurnEvents> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.BroadcastEnd, (data) => observer.next(data));
        });
    }

    onBroadcastMove(): Observable<{ position: Vec2; direction: Vec2 }> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.BroadcastMove, (movement: { position: Vec2; direction: Vec2 }) => observer.next(movement));
        });
    }

    onBroadcastItem(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.BroadcastItem, (data) => observer.next(data));
        });
    }

    onBroadcastDoor(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.BroadcastDoor, (data) => observer.next(data));
        });
    }

    onSwitchTurn(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.SwitchTurn, (data) => observer.next(data));
        });
    }

    onEndFight(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.End, (data) => observer.next(data));
        });
    }

    getCurrentPlayerId(): string {
        return this.socket.id as string;
    }

    getCurrentPlayer(): PlayerStats {
        return this.currenPlayer;
    }

    getGameSize(): number {
        return this.size;
    }

    disconnect(accessCode: string, playerId: string) {
        this.socket.emit(RoomEvents.DisconnectPlayer, { accessCode, playerId });
    }
}
