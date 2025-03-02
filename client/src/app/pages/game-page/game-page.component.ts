import { Component } from '@angular/core';
import { GameMapComponent } from '@app/components/game/game-map/game-map.component';
import { GameMapInfoComponent } from '@app/components/game/game-map-info/game-map-info.component';
import { GameMapPlayerDetailedComponent } from '@app/components/game/game-map-player-detailed/game-map-player-detailed.component';
import { GameMapPlayerToolsComponent } from '@app/components/game/game-map-player-tools/game-map-player-tools.component';
import { GameMapPlayerComponent } from '@app/components/game/game-map-player/game-map-player.component';

@Component({
    selector: 'app-game-page',
    imports: [GameMapComponent, GameMapInfoComponent, GameMapPlayerDetailedComponent, GameMapPlayerToolsComponent, GameMapPlayerComponent],
    templateUrl: './game-page.component.html',
    styleUrl: './game-page.component.scss',
})
export class GamePageComponent {}
