import { Component, inject, OnInit } from '@angular/core';
import { GameMapService } from '@app/services/code/game-map.service';
import { PlayerService } from '@app/services/code/player.service';

@Component({
    selector: 'app-game-map-info',
    imports: [],
    templateUrl: './game-map-info.component.html',
    styleUrl: './game-map-info.component.scss',
})
export class GameMapInfoComponent implements OnInit {
    mapSize: number;
    activePlayer: string;
    playerCount: number;

    private gameMapService: GameMapService = inject(GameMapService);
    private playerService: PlayerService = inject(PlayerService);

    constructor() {
        this.mapSize = 0;
        this.activePlayer = '';
        this.playerCount = 0;
    }

    ngOnInit() {
        this.mapSize = this.gameMapService.getGameMapSize();
        this.playerService.activePlayer$.subscribe((player) => {
            this.activePlayer = player.username;
        });
        this.playerService.players$.subscribe((players) => {
            this.playerCount = players.size;
        });
    }
}
