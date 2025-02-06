import { NgForOf } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { EditToolItemComponent } from '@app/components/edit-tool-item/edit-tool-item.component';
import { EditToolTileComponent } from '@app/components/edit-tool-tile/edit-tool-tile.component';
import { Item, Tile } from '@common/enums';

@Component({
    selector: 'app-edit-item-area',
    templateUrl: './edit-item-area.component.html',
    styleUrl: './edit-item-area.component.scss',
    imports: [EditToolTileComponent, EditToolItemComponent, MatCardModule, NgForOf],
})
export class EditItemAreaComponent {
    readonly itemType = Item;
    readonly tileType = Tile;

    readonly tiles = Object.values(Tile);
    readonly items = Object.values(Item);

    selectedGrid = 'TilesGrid';
    showGrid(gridId: string) {
        this.selectedGrid = gridId;
    }
}
