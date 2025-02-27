import { Component } from '@angular/core';
import { GameMapComponent } from '@app/components/game/game-map/game-map.component';

@Component({
    selector: 'app-game-page',
    imports: [GameMapComponent],
    templateUrl: './game-page.component.html',
    styleUrl: './game-page.component.scss',
})
export class GamePageComponent {}
