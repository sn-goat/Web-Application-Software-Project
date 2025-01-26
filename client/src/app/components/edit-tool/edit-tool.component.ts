import { Component, Input } from '@angular/core';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';

@Component({
    selector: 'app-edit-tool',
    templateUrl: './edit-tool.component.html',
    styleUrl: './edit-tool.component.scss',
})
export class EditToolComponent {
    @Input() type: string;
    @Input() url: string;
    @Input() alternate: string;

    constructor(private editToolMouse: EditToolMouse) {}

    onClick() {
        this.editToolMouse.updateIsTile(this.type === 'Tile');
        this.editToolMouse.updateSelectedUrl(this.url);
    }
}
