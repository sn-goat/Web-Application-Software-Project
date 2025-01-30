import { Component, Input } from '@angular/core';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';

@Component({
    selector: 'app-edit-tool',
    templateUrl: './edit-tool.component.html',
    styleUrl: './edit-tool.component.scss',
})
export class EditToolComponent {
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
