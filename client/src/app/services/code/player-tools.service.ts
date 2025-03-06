import { Injectable, inject } from '@angular/core';
import { Player } from '@common/player';
import { Item } from '@common/enums';
import { PlayerService } from './player.service';
import { BehaviorSubject, Observable } from 'rxjs';
// import { SocketService } from '@app/services/code/socket.service';

@Injectable({
    providedIn: 'root',
})
export class PlayerToolsService {
    items$: Observable<Item[]>;
    timer$: Observable<string>;

    private player: Player;
    private playerService: PlayerService = inject(PlayerService);
    private items = new BehaviorSubject<Item[]>([]); // for testing purposes
    private timer: BehaviorSubject<string> = new BehaviorSubject<string>('00:00');

    constructor() {
        this.player = {} as Player;
        this.items$ = this.items.asObservable();
        this.timer$ = this.timer.asObservable();
        this.setPlayer();
    }

    setPlayer() {
        this.playerService.players$.subscribe(() => {
            const player = this.playerService.getPlayer(this.playerService.getPlayerUsername());
            if (player) {
                this.player = player;
            }
        });
    }

    setTimer(timer: string): void {
        this.timer.next(timer);
    }

    addItem(item: Item): void {
        const items = this.items.value;
        if (item !== Item.DEFAULT) {
            if (items.length < 2) {
                items.push(item);
                this.items.next(items);
            } else {
                items.pop();
                items.push(item);
                this.items.next(items);
            }
        }
    }

    endTurn(): void {
        if (this.player) {
            // to be implemented with socket
        }
        // to be implemented
    }

    performAction(): void {
        if (this.player) {
            // to be implemented with socket
        }
        // to be implemented
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
