import { Component, Input } from '@angular/core';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';

@Component({
    selector: 'app-edit-tool-item',
    templateUrl: './edit-tool-tiles.component.html',
    styleUrl: './edit-tool-tiles.component.scss',
    imports: [],
})
export class EditToolTilesComponent {
    @Input() type: string;
    @Input() url: string;
    @Input() alternate: string;

    constructor(private editToolMouse: EditToolMouse) {}

    onClick() {
        this.editToolMouse.updateIsTile(true);
        this.editToolMouse.updateSelectedUrl(this.url);
    }
}
