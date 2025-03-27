// import { Injectable } from '@angular/core';
// import { Vec2 } from '@common/board';
// import { Tile } from '@common/enums';
// import { Fight, IGame, PathInfo, IRoom, TurnInfo } from '@common/game';
// import { FightEvents, GameEvents, TurnEvents } from '@common/game.gateway.events';
// import { IPlayer } from '@common/player';
// import { RoomEvents } from '@common/room.gateway.events';
// import { Observable } from 'rxjs';
// import { io, Socket } from 'socket.io-client';
// import { environment } from 'src/environments/environment';

// @Injectable({
//     providedIn: 'root',
// })
// export class SocketService {
//     gameRoom: IRoom;
//     private socket: Socket;
//     private readonly url: string = environment.serverUrl;
//     private currentPlayer: IPlayer;
//     private size: number = 0;
//     constructor() {
//         this.socket = io(this.url);
//     }

//     onRoomCreated(): Observable<unknown> {
//         return new Observable((observer) => {
//             this.socket.on(RoomEvents.RoomCreated, (data) => {
//                 this.gameRoom = data as IRoom;
//                 observer.next(data);
//             });
//         });
//     }

//     createRoom(size: number) {
//         this.size = size;
//         this.socket.emit(RoomEvents.CreateRoom, { organizerId: this.socket.id, size });
//     }

//     joinRoom(accessCode: string) {
//         this.socket.emit(RoomEvents.JoinRoom, { accessCode });
//         this.socket.emit(RoomEvents.GetRoom, { accessCode });
//     }

//     shareCharacter(accessCode: string, player: IPlayer) {
//         player.id = this.socket.id as string;
//         this.socket.emit(RoomEvents.ShareCharacter, { accessCode, player });
//     }

//     onPlayerJoined(): Observable<{ room: Room }> {
//         return new Observable((observer) => {
//             this.socket.on(RoomEvents.PlayerJoined, (room: { room: Room }) => {
//                 this.gameRoom = room.room;
//                 observer.next(room);
//             });
//         });
//     }

//     lockRoom(accessCode: string) {
//         this.socket.emit(RoomEvents.LockRoom, { accessCode });
//     }

//     unlockRoom(accessCode: string) {
//         this.socket.emit(RoomEvents.UnlockRoom, { accessCode });
//     }

//     removePlayer(accessCode: string, playerId: string) {
//         this.socket.emit(RoomEvents.RemovePlayer, { accessCode, playerId });
//     }

//     onPlayersList(): Observable<IPlayer[]> {
//         return new Observable((observer) => {
//             this.socket.on(RoomEvents.PlayerList, (players: IPlayer[]) => observer.next(players));
//         });
//     }

//     onPlayerRemoved(): Observable<IPlayer[]> {
//         return new Observable((observer) => {
//             this.socket.on(RoomEvents.PlayerRemoved, (players: IPlayer[]) => observer.next(players));
//         });
//     }

//     onPlayerDisconnected(): Observable<IPlayer[]> {
//         return new Observable((observer) => {
//             this.socket.on(RoomEvents.PlayerDisconnected, (players: IPlayer[]) => observer.next(players));
//         });
//     }

//     onJoinError(): Observable<{ message: string }> {
//         return new Observable((observer) => {
//             this.socket.on(RoomEvents.JoinError, (errorData: { message: string }) => {
//                 observer.next(errorData);
//             });
//         });
//     }

//     onRoomLocked(): Observable<unknown> {
//         return new Observable((observer) => {
//             this.socket.on(RoomEvents.RoomLocked, (data) => observer.next(data));
//         });
//     }

//     createGame(accessCode: string, mapName: string) {
//         this.socket.emit(GameEvents.Create, { accessCode, mapName, organizerId: this.socket.id });
//     }

//     configureGame(accessCode: string, players: IPlayer[]) {
//         this.socket.emit(GameEvents.Configure, { accessCode, players });
//     }

//     readyUp(accessCode: string, playerId: string) {
//         this.socket.emit(GameEvents.Ready, { accessCode, playerId });
//     }

//     movePlayer(accessCode: string, path: PathInfo, player: IPlayer) {
//         this.socket.emit(TurnEvents.Move, { accessCode, path, player });
//     }

//     toggleDebugMode(accessCode: string) {
//         this.socket.emit(GameEvents.Debug, accessCode);
//     }

//     endDebugMode(accessCode: string) {
//         this.socket.emit(GameEvents.EndDebug, accessCode);
//     }

//     debugMove(accessCode: string, direction: Vec2, player: IPlayer) {
//         this.socket.emit(TurnEvents.DebugMove, { accessCode, direction, player });
//     }

//     quitGame(accessCode: string, playerId: string) {
//         this.socket.emit(RoomEvents.QuitGame, { accessCode, playerId });
//     }

//     changeDoorState(accessCode: string, position: Vec2, player: IPlayer) {
//         this.socket.emit(TurnEvents.ChangeDoorState, { accessCode, position, player });
//     }

//     initFight(accessCode: string, player1: string, player2: string) {
//         this.socket.emit(FightEvents.Init, { accessCode, player1, player2 });
//     }

//     onFightInit(): Observable<Fight> {
//         return new Observable((observer) => {
//             this.socket.on(FightEvents.Init, (data) => {
//                 observer.next(data);
//             });
//         });
//     }

//     playerFlee(accessCode: string) {
//         this.socket.emit(FightEvents.Flee, accessCode);
//     }

//     playerAttack(accessCode: string) {
//         this.socket.emit(FightEvents.Attack, accessCode);
//     }

//     endTurn(accessCode: string) {
//         this.socket.emit(TurnEvents.End, accessCode);
//     }

//     // Receive
//     onBroadcastStartGame(): Observable<Game> {
//         return new Observable((observer) => {
//             this.socket.on(GameEvents.BroadcastStartGame, (game: Game) => observer.next(game));
//         });
//     }

//     onBroadcastDebugState(): Observable<void> {
//         return new Observable((observer) => {
//             this.socket.on(GameEvents.BroadcastDebugState, (data) => observer.next(data));
//         });
//     }

//     onBroadcastDebugEndState(): Observable<void> {
//         return new Observable((observer) => {
//             this.socket.on(GameEvents.BroadcastEndDebugState, (data) => observer.next(data));
//         });
//     }

//     onTimerUpdate(): Observable<{ remainingTime: number }> {
//         return new Observable((observer) => {
//             this.socket.on(TurnEvents.UpdateTimer, (data: { remainingTime: number }) => {
//                 observer.next(data);
//             });
//         });
//     }

//     onAssignSpawn(): Observable<Vec2> {
//         return new Observable((observer) => {
//             this.socket.on(GameEvents.AssignSpawn, (position) => {
//                 observer.next(position);
//             });
//         });
//     }

//     onFightTimerUpdate(): Observable<number> {
//         return new Observable((observer) => {
//             this.socket.on(FightEvents.UpdateTimer, (remainingTime) => {
//                 observer.next(remainingTime);
//             });
//         });
//     }
//     onTurnStart(): Observable<void> {
//         return new Observable((observer) => {
//             this.socket.on(TurnEvents.Start, (data) => observer.next(data));
//         });
//     }
//     onTurnUpdate(): Observable<TurnInfo> {
//         return new Observable((observer) => {
//             this.socket.on(TurnEvents.UpdateTurn, (turn: { player: IPlayer; path: Record<string, PathInfo> }) => {
//                 const receivedMap = new Map(Object.entries(turn.path));
//                 observer.next({ player: turn.player, path: receivedMap });
//             });
//         });
//     }

//     onTurnSwitch(): Observable<TurnInfo> {
//         return new Observable((observer) => {
//             this.socket.on(TurnEvents.PlayerTurn, (turn: { player: IPlayer; path: Record<string, PathInfo> }) => {
//                 const receivedMap = new Map(Object.entries(turn.path));
//                 observer.next({ player: turn.player, path: receivedMap });
//             });
//         });
//     }

//     onEndTurn(): Observable<unknown> {
//         return new Observable((observer) => {
//             this.socket.on(TurnEvents.End, (data) => observer.next(data));
//         });
//     }

//     onBroadcastEnd(): Observable<TurnEvents> {
//         return new Observable((observer) => {
//             this.socket.on(TurnEvents.BroadcastEnd, (data) => observer.next(data));
//         });
//     }

//     onBroadcastMove(): Observable<{ previousPosition: Vec2; player: IPlayer }> {
//         return new Observable((observer) => {
//             this.socket.on(TurnEvents.BroadcastMove, (movement: { previousPosition: Vec2; player: IPlayer }) => observer.next(movement));
//         });
//     }

//     onBroadcastItem(): Observable<unknown> {
//         return new Observable((observer) => {
//             this.socket.on(TurnEvents.BroadcastItem, (data) => observer.next(data));
//         });
//     }

//     onBroadcastDoor(): Observable<{ position: Vec2; newState: Tile.CLOSED_DOOR | Tile.OPENED_DOOR }> {
//         return new Observable((observer) => {
//             this.socket.on(TurnEvents.BroadcastDoor, (data) => observer.next(data));
//         });
//     }

//     onSwitchTurn(): Observable<Fight> {
//         return new Observable((observer) => {
//             this.socket.on(FightEvents.SwitchTurn, (data) => observer.next(data));
//         });
//     }

//     onEndFight(): Observable<IPlayer | null> {
//         return new Observable((observer) => {
//             this.socket.on(FightEvents.End, (data) => observer.next(data));
//         });
//     }

//     onQuitGame(): Observable<Game> {
//         return new Observable((observer) => {
//             this.socket.on(GameEvents.BroadcastQuitGame, (game) => observer.next(game));
//         });
//     }

//     onWinner(): Observable<IPlayer> {
//         return new Observable((observer) => {
//             this.socket.on(FightEvents.Winner, (winner) => {
//                 observer.next(winner);
//             });
//         });
//     }

//     onLoser(): Observable<IPlayer> {
//         return new Observable((observer) => {
//             this.socket.on(FightEvents.Loser, (loser) => {
//                 observer.next(loser);
//             });
//         });
//     }

//     onEndGame(): Observable<IPlayer> {
//         return new Observable((observer) => {
//             this.socket.on(GameEvents.BroadcastEndGame, (winner) => {
//                 observer.next(winner);
//             });
//         });
//     }

//     getCurrentPlayerId(): string {
//         return this.socket.id as string;
//     }

//     getCurrentPlayer(): IPlayer {
//         return this.currentPlayer;
//     }

//     getGameSize(): number {
//         return this.size;
//     }

//     getGameRoom(): Room {
//         return this.gameRoom;
//     }

//     disconnect(accessCode: string, playerId: string) {
//         this.socket.emit(RoomEvents.DisconnectPlayer, { accessCode, playerId });
//     }

//     onAdminDisconnected(): Observable<void> {
//         return new Observable((observer) => {
//             this.socket.on(RoomEvents.AdminDisconnected, () => observer.next());
//         });
//     }

//     resetSocketState(): void {
//         this.socket = io(this.url);
//         this.socket.connect();
//     }
// }
