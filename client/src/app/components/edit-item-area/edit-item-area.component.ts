import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { EditToolComponent } from '@app/components/edit-tool/edit-tool.component';
import { EditToolItemComponent } from '@app/components/edit-tool-item/edit-tool-item.component';
import { ItemType, TileType } from '../../../../../common/enums';

@Component({
    selector: 'app-edit-item-area',
    templateUrl: './edit-item-area.component.html',
    styleUrl: './edit-item-area.component.scss',
    imports: [EditToolComponent, EditToolItemComponent, MatCardModule],
})
export class EditItemAreaComponent {
    readonly itemType = ItemType;
    readonly tileType = TileType;

    selectedGrid = 'TilesGrid';
    showGrid(gridId: string) {
        this.selectedGrid = gridId;
    }
}
