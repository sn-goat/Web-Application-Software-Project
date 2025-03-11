import { Component, inject, OnInit } from '@angular/core';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_ITEMS } from '@app/constants/path';
import { GameService } from '@app/services/code/game.service';
import { PlayerToolsService } from '@app/services/code/player-tools.service';
import { SocketService } from '@app/services/code/socket.service';
import { Item } from '@common/enums';

@Component({
    selector: 'app-game-map-player-tools',
    templateUrl: './game-map-player-tools.component.html',
    styleUrls: ['./game-map-player-tools.component.scss'],
})
export class GameMapPlayerToolsComponent implements OnInit {
    items: Item[];
    timer: string;
    isPlayerTurn: boolean;

    readonly src = DEFAULT_PATH_ITEMS;
    readonly fileType = DEFAULT_FILE_TYPE;

    gameService: GameService = inject(GameService);
    private playerToolsService: PlayerToolsService = inject(PlayerToolsService);
    private socketService: SocketService = inject(SocketService);

    constructor() {
        this.items = [];
        this.timer = '';
    }

    ngOnInit() {
        this.playerToolsService.items$.subscribe((items) => {
            this.items = items;
        });

        this.socketService.onTimerUpdate().subscribe((time: { remainingTime: number }) => {
            this.timer = time.remainingTime.toString();
        });

        this.gameService.isPlayerTurn$.subscribe((isPlayerTurn) => {
            this.isPlayerTurn = isPlayerTurn;
        });
    }

    endTurn(): void {
        this.gameService.endTurn();
    }

    performAction(): void {
        this.playerToolsService.performAction();
    }
}
