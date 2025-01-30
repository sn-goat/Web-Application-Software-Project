import { Component, Input } from '@angular/core';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';
import { EditDragDrop } from '@app/classes/edit-drag-drop/edit-drag-drop';

@Component({
    selector: 'app-edit-tool-item',
    templateUrl: './edit-tool-item.component.html',
    styleUrl: './edit-tool-item.component.scss',
    imports: [],
})
export class EditToolItemComponent {
    @Input() type: string;
    @Input() alternate: string;

    src = './assets/items/';
    fileType = '.png';

    isDraggable = true;

    constructor(
        private editToolMouse: EditToolMouse,
        private editDragDrop: EditDragDrop,
    ) {
        this.editDragDrop.wasDragged$.subscribe((wasDragged) => {
            this.isDraggable = wasDragged.find((type) => type === this.type) === undefined;
        });
    }

    onClick() {
        this.editToolMouse.updateIsTile(false);
        this.editToolMouse.updateSelectedTool(this.type);
    }

    onDragStart(event: DragEvent) {
        event.preventDefault();
        this.editDragDrop.setCurrentItem(this.type);
    }
}
