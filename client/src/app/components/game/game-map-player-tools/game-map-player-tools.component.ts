import { Component, inject, OnInit } from '@angular/core';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_ITEMS } from '@app/constants/path';
import { PlayerToolsService } from '@app/services/code/player-tools.service';
import { Item } from '@common/enums';

@Component({
    selector: 'app-game-map-player-tools',
    templateUrl: './game-map-player-tools.component.html',
    styleUrls: ['./game-map-player-tools.component.scss'],
})
export class GameMapPlayerToolsComponent implements OnInit {
    items: Item[];
    timer: string;

    readonly src = DEFAULT_PATH_ITEMS;
    readonly fileType = DEFAULT_FILE_TYPE;

    private playerToolsService: PlayerToolsService = inject(PlayerToolsService);

    constructor() {
        this.items = [];
        this.timer = '';
    }

    ngOnInit() {
        this.playerToolsService.items$.subscribe((items) => {
            this.items = items;
        });
        this.playerToolsService.timer$.subscribe((timer) => {
            this.timer = timer;
        });
    }

    endTurn(): void {
        // This should also disable action mode in the service.
        this.playerToolsService.endTurn();
    }

    performAction(): void {
        // This should enable action mode in the service.
        this.playerToolsService.performAction();
    }
}
