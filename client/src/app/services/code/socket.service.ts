import { Injectable } from '@angular/core';
import { Vec2 } from '@common/board';
import { Tile } from '@common/enums';
import { Fight, Game, PathInfo, Room, TurnInfo } from '@common/game';
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
    private currentPlayer: PlayerStats;
    private size: number = 0;
    constructor() {
        this.socket = io(this.url);
    }

    onRoomCreated(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.RoomCreated, (data) => {
                this.gameRoom = data as Room;
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
        this.socket.emit(RoomEvents.GetRoom, { accessCode });
    }

    shareCharacter(accessCode: string, player: PlayerStats) {
        player.id = this.socket.id as string;
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

    onRoomData(): Observable<Room> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.RoomData, (data) => observer.next(data));
        });
    }

    // Game events
    // Send
    createGame(accessCode: string, mapName: string) {
        this.socket.emit(GameEvents.Create, { accessCode, mapName, organizerId: this.socket.id });
    }

    configureGame(accessCode: string, players: PlayerStats[]) {
        this.socket.emit(GameEvents.Configure, { accessCode, players });
    }

    readyUp(accessCode: string, playerId: string) {
        this.socket.emit(GameEvents.Ready, { accessCode, playerId });
    }

    movePlayer(accessCode: string, path: PathInfo, player: PlayerStats) {
        this.socket.emit(TurnEvents.Move, { accessCode, path, player });
    }

    toggleDebugMode(accessCode: string) {
        this.socket.emit(GameEvents.Debug, accessCode);
    }

    debugMove(accessCode: string, direction: Vec2, player: PlayerStats) {
        this.socket.emit(TurnEvents.DebugMove, { accessCode, direction, player });
    }

    quitGame(accessCode: string, playerId: string) {
        this.socket.emit(GameEvents.Quit, { accessCode, playerId });
        this.socket.emit(RoomEvents.QuitGame, { accessCode, playerId });
    }

    changeDoorState(accessCode: string, position: Vec2, player: PlayerStats) {
        this.socket.emit(TurnEvents.ChangeDoorState, { accessCode, position, player });
    }

    initFight(accessCode: string, player1: PlayerStats, player2: PlayerStats) {
        this.socket.emit(FightEvents.Init, { accessCode, player1, player2 });
    }

    onFightInit(): Observable<Fight> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.Init, (data) => {
                observer.next(data);
            });
        });
    }

    playerFlee(accessCode: string) {
        this.socket.emit(FightEvents.Flee, accessCode);
    }

    playerAttack(accessCode: string) {
        this.socket.emit(FightEvents.Attack, accessCode);
    }

    endTurn(accessCode: string) {
        this.socket.emit(TurnEvents.End, accessCode);
    }

    // Receive
    onBroadcastStartGame(): Observable<Game> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.BroadcastStartGame, (game: Game) => observer.next(game));
            this.socket.on(GameEvents.BroadcastStartGame, (game: Game) => observer.next(game));
        });
    }

    onBroadcastDebugState(): Observable<void> {
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

    onAssignSpawn(): Observable<Vec2> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.AssignSpawn, (position) => {
                observer.next(position);
            });
        });
    }

    onFightTimerUpdate(): Observable<number> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.UpdateTimer, (remainingTime) => {
                observer.next(remainingTime);
            });
        });
    }

    onTurnUpdate(): Observable<TurnInfo> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.UpdateTurn, (turn: { player: PlayerStats; path: Record<string, PathInfo> }) => {
                const receivedMap = new Map(Object.entries(turn.path));
                observer.next({ player: turn.player, path: receivedMap });
            });
        });
    }

    onTurnSwitch(): Observable<TurnInfo> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.PlayerTurn, (turn: { player: PlayerStats; path: Record<string, PathInfo> }) => {
                const receivedMap = new Map(Object.entries(turn.path));
                observer.next({ player: turn.player, path: receivedMap });
            });
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

    onBroadcastMove(): Observable<{ previousPosition: Vec2; player: PlayerStats }> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.BroadcastMove, (movement: { previousPosition: Vec2; player: PlayerStats }) => observer.next(movement));
        });
    }

    onBroadcastItem(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.BroadcastItem, (data) => observer.next(data));
        });
    }

    onBroadcastDoor(): Observable<{ position: Vec2; newState: Tile.CLOSED_DOOR | Tile.OPENED_DOOR }> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.BroadcastDoor, (data) => observer.next(data));
        });
    }

    onSwitchTurn(): Observable<Fight> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.SwitchTurn, (data) => observer.next(data));
        });
    }

    onEndFight(): Observable<PlayerStats | null> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.End, (data) => observer.next(data));
        });
    }

    onQuitGame(): Observable<{ game: Game; lastPlayer: PlayerStats }> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.BroadcastQuitGame, (game: { game: Game; lastPlayer: PlayerStats }) => observer.next(game));
        });
    }

    onQuitRoomGame(): Observable<PlayerStats[]> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.QuitGame, (players: PlayerStats[]) => observer.next(players));
        });
    }

    onWinner(): Observable<PlayerStats> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.Winner, (winner) => {
                observer.next(winner);
            });
        });
    }

    onEndGame(): Observable<PlayerStats> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.End, (winner) => {
                observer.next(winner);
            });
        });
    }

    onLoser(): Observable<void> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.Loser, (data) => observer.next(data));
        });
    }

    getCurrentPlayerId(): string {
        return this.socket.id as string;
    }

    getCurrentPlayer(): PlayerStats {
        return this.currentPlayer;
    }

    getGameSize(): number {
        return this.size;
    }

    getGameRoom(): Room {
        return this.gameRoom;
    }

    disconnect(accessCode: string, playerId: string) {
        this.socket.emit(RoomEvents.DisconnectPlayer, { accessCode, playerId });
    }

    onAdminDisconnected(): Observable<void> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.AdminDisconnected, () => observer.next());
        });
    }

    resetSocketState(): void {
        // Déconnexion de tous les écouteurs d'événements
        this.socket.removeAllListeners();

        this.gameRoom = undefined as unknown as Room;
        this.currentPlayer = undefined as unknown as PlayerStats;

        this.socket.disconnect();
        this.socket.connect();
    }
}
