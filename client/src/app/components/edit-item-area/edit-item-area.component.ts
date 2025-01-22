import { Component } from '@angular/core';
import { EditToolComponent } from '@app/components/edit-tool/edit-tool.component';

@Component({
    selector: 'app-edit-item-area',
    templateUrl: './edit-item-area.component.html',
    styleUrl: './edit-item-area.component.scss',
    imports: [EditToolComponent],
})
export class EditItemAreaComponent {
    selectedGrid = 'TilesGrid';
    showGrid(gridId: string) {
        this.selectedGrid = gridId;
    }
}
