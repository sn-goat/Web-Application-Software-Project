import { Component, inject, OnInit } from '@angular/core';
import { Item } from '@common/enums';
import { PlayerToolsService } from '@app/services/code/player-tools.service';
import { DEFAULT_PATH_ITEMS, DEFAULT_FILE_TYPE } from '@app/constants/path';

@Component({
    selector: 'app-game-map-player-tools',
    imports: [],
    templateUrl: './game-map-player-tools.component.html',
    styleUrl: './game-map-player-tools.component.scss',
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
        this.playerToolsService.endTurn();
    }

    performAction(): void {
        this.playerToolsService.performAction();
    }
}
