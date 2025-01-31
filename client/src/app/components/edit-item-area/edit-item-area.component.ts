import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { EditToolItemComponent } from '@app/components/edit-tool-item/edit-tool-item.component';
import { EditToolTileComponent } from '@app/components/edit-tool-tile/edit-tool-tile.component';
import { ItemType, TileType } from '../../../../../common/enums';

@Component({
    selector: 'app-edit-item-area',
    templateUrl: './edit-item-area.component.html',
    styleUrl: './edit-item-area.component.scss',
    imports: [EditToolTileComponent, EditToolItemComponent, MatCardModule],
})
export class EditItemAreaComponent {
    readonly itemType = ItemType;
    readonly tileType = TileType;

    selectedGrid = 'TilesGrid';
    showGrid(gridId: string) {
        this.selectedGrid = gridId;
    }
}
