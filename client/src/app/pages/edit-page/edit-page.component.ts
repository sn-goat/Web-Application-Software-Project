import { Component } from '@angular/core';
import { BoardGameComponent } from '@app/components/board-game/board-game.component';

@Component({
    selector: 'app-edit-page',
    templateUrl: './edit-page.component.html',
    styleUrls: ['./edit-page.component.scss'],

    imports: [BoardGameComponent],
})
export class EditPageComponent {
    readonly defaultMapSize = 10;

    mapName = '';
    hasModeCTF = false;
    mapSize = this.defaultMapSize;
    mapDescription = '';
    isMapSaved = false;
    selectedGrid = 'TilesGrid';
    onSubmit() {
        this.isMapSaved = true;
    }
    showGrid(gridId: string) {
        this.selectedGrid = gridId;
    }
}
