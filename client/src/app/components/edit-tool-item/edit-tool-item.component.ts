import { Component, Input } from '@angular/core';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';

@Component({
    selector: 'app-edit-tool-item',
    templateUrl: './edit-tool-item.component.html',
    styleUrl: './edit-tool-item.component.scss',
    imports: [],
})
export class EditToolItemComponent {
    @Input() type: string;
    @Input() url: string;
    @Input() alternate: string;

    constructor(private editToolMouse: EditToolMouse) {}

    onClick() {
        this.editToolMouse.updateIsTile(false);
        this.editToolMouse.updateItemUrl(this.url);
    }
}
