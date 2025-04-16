import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { SubLifecycleHandlerComponent } from '@app/components/common/sub-lifecycle-handler/subscription-lifecycle-handler.component';
import { GameService } from '@app/services/game/game.service';
import { IPlayer } from '@common/player';

@Component({
    selector: 'app-game-map-info',
    imports: [],
    templateUrl: './game-map-info.component.html',
    styleUrl: './game-map-info.component.scss',
})
export class GameMapInfoComponent extends SubLifecycleHandlerComponent implements OnInit, OnDestroy {
    mapSize: number = 0;
    activePlayer: IPlayer | null = null;
    playerCount: number = 0;
    private readonly gameService: GameService = inject(GameService);

    ngOnInit() {
        this.autoSubscribe(this.gameService.activePlayer, (player: IPlayer | null) => {
            this.activePlayer = player;
        });
        this.autoSubscribe(this.gameService.playingPlayers, (players) => {
            this.playerCount = players.length;
        });
        this.autoSubscribe(this.gameService.map, (map) => {
            this.mapSize = map.length;
        });
    }
}
