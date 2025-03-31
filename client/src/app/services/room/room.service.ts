import { inject, Injectable } from '@angular/core';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { IPlayer } from '@common/player';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class RoomService {
    connected: BehaviorSubject<IPlayer[]> = new BehaviorSubject<IPlayer[]>([]);
    isRoomLocked: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    maxPlayer: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private readonly socketReceiver: SocketReceiverService = inject(SocketReceiverService);

    constructor() {
        this.socketReceiver.onRoomCreated().subscribe((room) => {
            this.connected.next(room.game.players);
            this.isRoomLocked.next(room.isLocked);
            this.maxPlayer.next(room.game.maxPlayers);
        });

        this.socketReceiver.onPlayerJoined().subscribe((room) => {
            this.connected.next(room.game.players);
            this.isRoomLocked.next(room.isLocked);
        });

        this.socketReceiver.onPlayersUpdated().subscribe((players) => {
            this.connected.next(players);
        });

        this.socketReceiver.onRoomLocked().subscribe(() => {
            this.isRoomLocked.next(true);
        });

        this.socketReceiver.onRoomUnlocked().subscribe(() => {
            this.isRoomLocked.next(false);
        });
    }

    reset() {
        this.connected.next([]);
        this.isRoomLocked.next(false);
        this.maxPlayer.next(0);
    }
}
