import { Component } from '@angular/core';
import { EditToolComponent } from '@app/components/edit-tool/edit-tool.component';
import { Tiles, Items } from '@app/enum/tile';

@Component({
    selector: 'app-edit-item-area',
    templateUrl: './edit-item-area.component.html',
    styleUrl: './edit-item-area.component.scss',
    imports: [EditToolComponent],
})
export class EditItemAreaComponent {
    selectedTool: Tiles | Items = Tiles.Default;

    selectedGrid = 'TilesGrid';
    showGrid(gridId: string) {
        this.selectedGrid = gridId;
    }
}
