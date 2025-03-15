import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_ITEMS } from '@app/constants/path';
import { GameService } from '@app/services/code/game.service';
import { PlayerToolsService } from '@app/services/code/player-tools.service';
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
    isPlayerTurn: boolean;

    readonly src = DEFAULT_PATH_ITEMS;
    readonly fileType = DEFAULT_FILE_TYPE;

    gameService: GameService = inject(GameService);
    private playerToolsService: PlayerToolsService = inject(PlayerToolsService);
    private socketService: SocketService = inject(SocketService);
    private subscriptions: Subscription[] = [];

    constructor() {
        this.items = [];
        this.timer = '';
    }

    ngOnInit() {
        this.subscriptions.push(
            this.playerToolsService.items$.subscribe((items) => {
                this.items = items;
            }),

            this.socketService.onTimerUpdate().subscribe((time: { remainingTime: number }) => {
                this.timer = time.remainingTime.toString();
            }),

            this.gameService.isPlayerTurn$.subscribe((isPlayerTurn) => {
                this.isPlayerTurn = isPlayerTurn;
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
        this.playerToolsService.performAction();
    }
}
