import { Component } from '@angular/core';

@Component({
    selector: 'app-edit-item-area',
    templateUrl: './edit-item-area.component.html',
    styleUrl: './edit-item-area.component.scss',
    imports: [],
})
export class EditItemAreaComponent {
    selectedGrid = 'TilesGrid';
    showGrid(gridId: string) {
        this.selectedGrid = gridId;
    }
}
