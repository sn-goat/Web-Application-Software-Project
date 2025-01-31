import { Component, Input } from '@angular/core';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';
import { TileType } from '@common/enums';
import { DEFAULT_PATH_TILES } from '@app/constants/path';

@Component({
    selector: 'app-edit-tool-tiles',
    templateUrl: './edit-tool-tiles.component.html',
    styleUrl: './edit-tool-tiles.component.scss',
    imports: [],
})
export class EditToolTilesComponent {
    @Input() type!: TileType;
    src: string = DEFAULT_PATH_TILES;
    extenstion: string = '.png';

    constructor(private editToolMouse: EditToolMouse) {}

    onClick() {
        this.editToolMouse.updateSelectedTile(this.type);
    }
}
