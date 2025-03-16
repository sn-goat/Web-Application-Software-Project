import { Injectable } from '@angular/core';
import { Item } from '@common/enums';
// import { PlayerStats } from '@common/player';
import { BehaviorSubject, Observable } from 'rxjs';
// import { PlayerService } from './player.service';
// import { SocketService } from '@app/services/code/socket.service';

@Injectable({
    providedIn: 'root',
})
export class PlayerToolsService {
    items$: Observable<Item[]>;
    timer$: Observable<string>;

    // private player: PlayerStats;
    // private playerService: PlayerService = inject(PlayerService);
    private items = new BehaviorSubject<Item[]>([]);
    private timer: BehaviorSubject<string> = new BehaviorSubject<string>('00:00');

    constructor() {
        // this.player = {} as PlayerStats;
        this.items$ = this.items.asObservable();
        this.timer$ = this.timer.asObservable();
        // this.setPlayer();
    }

    // setPlayer() {
    //     this.playerService.players$.subscribe(() => {
    //         const player = this.playerService.getPlayer(this.playerService.getPlayerName());
    //         if (player) {
    //             this.player = player;
    //         }
    //     });
    // }

    setTimer(timer: string): void {
        this.timer.next(timer);
    }

    addItem(item: Item): void {
        const items = this.items.value;
        if (item !== Item.DEFAULT) {
            if (items.length < 2) {
                items.push(item);
            } else {
                items.pop();
                items.push(item);
            }
            this.items.next(items);
        }
    }

    removeItem(item: Item): void {
        const items = this.items.value;
        const index = items.indexOf(item);
        if (index !== -1) {
            items.splice(index, 1);
            this.items.next(items);
        }
    }
}
