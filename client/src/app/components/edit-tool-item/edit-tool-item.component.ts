import { Component, Input } from '@angular/core';
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

    constructor(private editDragDrop: EditDragDrop) {
        this.editDragDrop.wasDragged$.subscribe((wasDragged) => {
            this.isDraggable = wasDragged.find((type) => type === this.type) === undefined;
        });
    }

    onDragStart(event: DragEvent) {
        event.preventDefault();
        this.editDragDrop.setCurrentItem(this.type);
    }
}
