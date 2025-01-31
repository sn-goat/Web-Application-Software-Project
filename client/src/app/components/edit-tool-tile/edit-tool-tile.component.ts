import { Component, Input } from '@angular/core';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';

@Component({
    selector: 'app-edit-tool-tile',
    templateUrl: './edit-tool-tile.component.html',
    styleUrl: './edit-tool-tile.component.scss',
})
export class EditToolTileComponent {
    @Input() type: string;
    @Input() alternate: string;

    src = './assets/tiles/';
    fileType = '.png';

    constructor(private editToolMouse: EditToolMouse) {}

    onClick() {
        this.editToolMouse.updateIsTile(true);
        this.editToolMouse.updateSelectedTool(this.type);
    }
}
