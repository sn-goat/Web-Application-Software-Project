import { Component, Input } from '@angular/core';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';
import { TileType } from '@common/enums';
import { DEFAULT_PATH_TILES } from '@app/constants/path';

@Component({
    selector: 'app-edit-tool-tile',
    templateUrl: './edit-tool-tile.component.html',
    styleUrl: './edit-tool-tile.component.scss',
    imports: [],
})
export class EditToolTileComponent {
    @Input() type!: TileType;
    src: string = DEFAULT_PATH_TILES;
    extenstion: string = '.png';

    constructor(private editToolMouse: EditToolMouse) {}

    onClick() {
        this.editToolMouse.updateSelectedTile(this.type);
    }
}
