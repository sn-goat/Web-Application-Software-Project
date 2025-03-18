import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { GameService } from '@app/services/game/game.service';
import { PlayerStats } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-map-info',
    imports: [],
    templateUrl: './game-map-info.component.html',
    styleUrl: './game-map-info.component.scss',
})
export class GameMapInfoComponent implements OnInit, OnDestroy {
    mapSize: number = 0;
    activePlayer: PlayerStats | null = null;
    playerCount: number = 0;
    private readonly gameService: GameService = inject(GameService);
    private subscriptions: Subscription[] = [];

    ngOnInit() {
        this.subscriptions.push(
            this.gameService.activePlayer.subscribe((player: PlayerStats | null) => {
                this.activePlayer = player;
            }),
            this.gameService.playingPlayers.subscribe((players) => {
                this.playerCount = players.length;
            }),
            this.gameService.map.subscribe((map) => {
                this.mapSize = map.length;
            }),
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
