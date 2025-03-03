import { Component, AfterViewInit, ViewChild, inject } from '@angular/core';
import { GameMapComponent } from '@app/components/game/game-map/game-map.component';
import { GameMapInfoComponent } from '@app/components/game/game-map-info/game-map-info.component';
import { GameMapPlayerDetailedComponent } from '@app/components/game/game-map-player-detailed/game-map-player-detailed.component';
import { GameMapPlayerToolsComponent } from '@app/components/game/game-map-player-tools/game-map-player-tools.component';
import { GameMapPlayerComponent } from '@app/components/game/game-map-player/game-map-player.component';
import { HeaderBarComponent } from '@app/components/common/header-bar/header-bar.component';
import { GameService } from '@app/services/code/game.service';
import { PlayerService } from '@app/services/code/player.service';

@Component({
    selector: 'app-game-page',
    imports: [
        GameMapComponent,
        GameMapInfoComponent,
        GameMapPlayerDetailedComponent,
        GameMapPlayerToolsComponent,
        GameMapPlayerComponent,
        HeaderBarComponent,
    ],
    templateUrl: './game-page.component.html',
    styleUrl: './game-page.component.scss',
})
export class GamePageComponent implements AfterViewInit {
    @ViewChild(HeaderBarComponent) headerBar!: HeaderBarComponent;

    private gameService = inject(GameService);
    private playerService = inject(PlayerService);

    ngAfterViewInit(): void {
        const originalAbandonMethod = this.headerBar.getBack;

        this.headerBar.getBack = () => {
            this.gameService.confirmAndAbandonGame(this.playerService.getPlayerUsername()).then((confirmed) => {
                if (confirmed) {
                    originalAbandonMethod.call(this.headerBar);
                }
            });
        };
    }
}
