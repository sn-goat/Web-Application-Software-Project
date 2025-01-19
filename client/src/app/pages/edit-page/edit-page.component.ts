import { Component } from '@angular/core';

@Component({
    selector: 'app-edit-page',
    templateUrl: './edit-page.component.html',
    styleUrls: ['./edit-page.component.scss'],
})
export class EditPageComponent {
    mapName = '';
    hasModeCTF = false;
    mapSize = 10;
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
