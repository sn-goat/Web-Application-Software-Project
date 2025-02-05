import { Component, Input } from '@angular/core';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';
import { ItemType } from '@common/enums';

@Component({
    selector: 'app-edit-tool-item',
    templateUrl: './edit-tool-item.component.html',
    styleUrl: './edit-tool-item.component.scss',
    imports: [],
})
export class EditToolItemComponent {
    @Input() type: ItemType;
    @Input() alternate: string;

    src = './assets/items/';
    fileType = '.png';

    isDraggable = true;

    constructor(private editToolMouse: EditToolMouse) {}

    onDragStart() {
        this.editToolMouse.updateSelectedItem(this.type);
    }

    onDragEnter(event: MouseEvent) {
        event.preventDefault();
    }
}
