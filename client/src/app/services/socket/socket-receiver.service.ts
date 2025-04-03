import { Injectable } from '@angular/core';
import { Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { IFight, IGame, IRoom, PathInfo, TurnInfo } from '@common/game';
import { FightEvents, GameEvents, TurnEvents } from '@common/game.gateway.events';
import { IPlayer } from '@common/player';
import { RoomEvents } from '@common/room.gateway.events';
import { Observable } from 'rxjs';
import { SharedSocketService } from './shared-socket.service';
import { SocketEmitterService } from './socket-emitter.service';

@Injectable({
    providedIn: 'root',
})
export class SocketReceiverService {
    private socket = this.sharedSocketService.socket;

    constructor(
        private sharedSocketService: SharedSocketService,
        private socketEmitter: SocketEmitterService,
    ) {}

    onRoomCreated(): Observable<IRoom> {
        return new Observable((observer) => {
            this.socket.once(RoomEvents.RoomCreated, (room) => {
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

    onJoinError(): Observable<string> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.JoinError, (message: string) => {
                observer.next(message);
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

    onPlayerRemoved(): Observable<string> {
        return new Observable((observer) => {
            this.socket.once(RoomEvents.PlayerRemoved, (message: string) => {
                observer.next(message);
            });
        });
    }

    onPlayersUpdated(): Observable<IPlayer[]> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.PlayersUpdated, (players: IPlayer[]) => {
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

    onRoomUnlocked(): Observable<void> {
        return new Observable((observer) => {
            this.socket.on(RoomEvents.RoomUnlocked, (data) => {
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

    onGameStartedError(): Observable<string> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.Error, (message: string) => {
                observer.next(message);
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
            this.socket.once(GameEvents.GameEnded, (winner: IPlayer) => {
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

    onPlayerTurnUpdate(): Observable<TurnInfo> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.UpdateTurn, (turn: { player: IPlayer; path: Record<string, PathInfo> }) => {
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
            this.socket.on(TurnEvents.PlayerMoved, (movement: { previousPosition: Vec2; player: IPlayer }) => {
                observer.next(movement);
            });
        });
    }

    onDoorStateChanged(): Observable<{ doorPosition: Vec2; newDoorState: Tile.CLOSED_DOOR | Tile.OPENED_DOOR }> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.DoorStateChanged, (data) => {
                observer.next(data);
            });
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

    onFightTimerUpdate(): Observable<number> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.UpdateTimer, (remainingTime) => {
                observer.next(remainingTime);
            });
        });
    }

    onEndFight(): Observable<IPlayer[] | null> {
        return new Observable((observer) => {
            this.socket.on(FightEvents.End, (data) => {
                observer.next(data);
            });
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

    onItemCollected(): Observable<{ player: IPlayer, position: Vec2 }> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.BroadcastItem, (data: { player: IPlayer, position: Vec2 }) => {
                console.log(`[SocketReceiver] Item collected`);
                observer.next(data);
            });
        });
    }

    onInventoryFull(): Observable<{ player: IPlayer, item: Item, position: Vec2 }> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.InventoryFull, (data: { player: IPlayer, item: Item, position: Vec2 }) => {
                console.log(`[SocketReceiver] Inventory full`);
                observer.next(data);
            });
        });
    }
    
    onMapUpdate(): Observable<{ player: IPlayer, item: Item, position: Vec2}> {
        return new Observable((observer) => {
            this.socket.on(TurnEvents.MapUpdate, (data: { player: IPlayer, item: Item, position: Vec2}) => {
                console.log(`[SocketReceiver] Map updated`);
                observer.next(data);
            });
        });
    }
}
