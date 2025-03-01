import { Component } from '@angular/core';
import { GameMapComponent } from '@app/components/game/game-map/game-map.component';
import { GameMapInfoComponent } from '@app/components/game/game-map-info/game-map-info.component';
import { GameMapPlayerDetailedComponent } from '@app/components/game/game-map-player-detailed/game-map-player-detailed.component';

@Component({
    selector: 'app-game-page',
    imports: [GameMapComponent, GameMapInfoComponent, GameMapPlayerDetailedComponent],
    templateUrl: './game-page.component.html',
    styleUrl: './game-page.component.scss',
})
export class GamePageComponent {}
