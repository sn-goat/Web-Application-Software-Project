import { Component, Input } from '@angular/core';
import { ToolSelectionService } from '@app/services/tool-selection.service';
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

    constructor(private toolSelection: ToolSelectionService) {}

    onDragStart() {
        this.toolSelection.updateSelectedItem(this.type);
    }

    onDragEnter(event: MouseEvent) {
        event.preventDefault();
    }
}
