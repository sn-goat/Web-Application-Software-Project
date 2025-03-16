import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_ITEMS } from '@app/constants/path';
import { GameService } from '@app/services/code/game.service';
import { PlayerService } from '@app/services/code/player.service';
import { SocketService } from '@app/services/code/socket.service';
import { Item } from '@common/enums';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-map-player-tools',
    templateUrl: './game-map-player-tools.component.html',
    styleUrls: ['./game-map-player-tools.component.scss'],
})
export class GameMapPlayerToolsComponent implements OnInit, OnDestroy {
    items: Item[];
    timer: string;
    isActivePlayer: boolean = false;

    readonly src = DEFAULT_PATH_ITEMS;
    readonly fileType = DEFAULT_FILE_TYPE;

    private gameService: GameService = inject(GameService);
    private playerService: PlayerService = inject(PlayerService);
    private socketService: SocketService = inject(SocketService);
    private subscriptions: Subscription[] = [];

    constructor() {
        this.items = [];
        this.timer = '';
    }

    ngOnInit() {
        this.subscriptions.push(
            this.socketService.onTimerUpdate().subscribe((time: { remainingTime: number }) => {
                this.timer = time.remainingTime.toString();
            }),

            this.playerService.isActivePlayer.subscribe((isActive) => {
                this.isActivePlayer = isActive;
            }),
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    endTurn(): void {
        this.gameService.endTurn();
    }

    performAction(): void {
        this.gameService.toggleActionMode();
    }
}
