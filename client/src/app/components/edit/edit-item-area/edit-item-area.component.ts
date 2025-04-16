import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { EditToolItemComponent } from '@app/components/edit/edit-tool-item/edit-tool-item.component';
import { EditToolTileComponent } from '@app/components/edit/edit-tool-tile/edit-tool-tile.component';
import { Item, Tile } from '@common/enums';

@Component({
    selector: 'app-edit-item-area',
    templateUrl: './edit-item-area.component.html',
    styleUrl: './edit-item-area.component.scss',
    imports: [EditToolTileComponent, EditToolItemComponent, MatCardModule],
})
export class EditItemAreaComponent {
    selectedDescription: string = '';
    readonly tileType = Tile;
    readonly tiles = Object.values(Tile);
    readonly items = Object.values(Item);
}
