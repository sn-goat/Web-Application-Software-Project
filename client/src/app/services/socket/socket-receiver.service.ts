import { Injectable } from '@angular/core';
import { RoomEvents } from '@common/room.gateway.events';
import { FightEvents, GameEvents, TurnEvents } from '@common/game.gateway.events';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { SocketEmitterService } from './socket-emitter.service';
import { IRoom, IGame, PathInfo, TurnInfo, IFight } from '@common/game';
import { IPlayer } from '@common/player';
import { Vec2 } from '@common/board';
import { Tile } from '@common/enums';

@Injectable({
    providedIn: 'root',
})
export class SocketReceiverService {
    private socket: Socket;
    private readonly url: string = environment.serverUrl;
    private socketEmitter: SocketEmitterService;

    constructor() {
        this.socket = io(this.url);
    }

    onRoomCreated(): Observable<IRoom> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.RoomCreated, (room: IRoom) => {
                this.socketEmitter.setAccessCode(room.accessCode);
                observer.next(room);
            });
        });
    }

    onPlayerJoined(): Observable<IRoom> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.PlayerJoined, (room: IRoom) => {
                observer.next(room);
            });
        });
    }

    onSetCharacter(): Observable<IPlayer> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.SetCharacter, (player: IPlayer) => {
                observer.next(player);
            });
        });
    }

    onPlayerRemoved(): Observable<IPlayer[]> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.PlayerRemoved, (players: IPlayer[]) => {
                observer.next(players);
            });
        });
    }

    onPlayerDisconnected(): Observable<IPlayer[]> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.PlayerDisconnected, (players: IPlayer[]) => {
                observer.next(players);
            });
        });
    }

    onRoomLocked(): Observable<void> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.RoomLocked, (data) => {
                observer.next(data);
            });
        });
    }

    onRoomUnLocked(): Observable<void> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.RoomUnlocked, (data) => {
                observer.next(data);
            });
        });
    }

    onAdminDisconnected(): Observable<void> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.AdminDisconnected, (data) => {
                observer.next(data);
            });
        });
    }

    onGameStarted(): Observable<IGame> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.GameStarted, (game: IGame) => {
                observer.next(game);
            });
        });
    }

    onDebugModeChanged(): Observable<boolean> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.DebugStateChanged, (isDebug: boolean) => {
                observer.next(isDebug);
            });
        });
    }

    onGameEnded(): Observable<IPlayer> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.GameEnded, (winner) => {
                observer.next(winner);
            });
        });
    }

    onPlayerTurnChanged(): Observable<TurnInfo> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.PlayerTurn, (turn: { player: IPlayer; path: Record<string, PathInfo> }) => {
                const receivedMap = new Map(Object.entries(turn.path));
                observer.next({ player: turn.player, path: receivedMap });
            });
        });
    }

    onTurnStart(): Observable<void> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.Start, (data) => observer.next(data));
        });
    }

    onTimerUpdate(): Observable<number> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.UpdateTimer, (remainingTime) => {
                observer.next(remainingTime);
            });
        });
    }

    onPlayerMoved(): Observable<{ previousPosition: Vec2; player: IPlayer }> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.PlayerMoved, (movement: { previousPosition: Vec2; player: IPlayer }) => observer.next(movement));
        });
    }

    onDoorStateChanged(): Observable<{ position: Vec2; newState: Tile.CLOSED_DOOR | Tile.OPENED_DOOR }> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.DoorStateChanged, (data) => observer.next(data));
        });
    }

    onFightInit(): Observable<IFight> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.Init, (fight) => {
                observer.next(fight);
            });
        });
    }

    onFighterTurnChanged(): Observable<IFight> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.ChangeFighter, (data) => observer.next(data));
        });
    }

    onEndFight(): Observable<IPlayer | null> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.End, (data) => observer.next(data));
        });
    }

    onWinner(): Observable<IPlayer> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.Winner, (winner) => {
                observer.next(winner);
            });
        });
    }

    onLoser(): Observable<IPlayer> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.Loser, (loser) => {
                observer.next(loser);
            });
        });
    }
}
