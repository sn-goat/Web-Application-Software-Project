import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { ToolSelectionService } from '@app/services/tool-selection.service';
import { DEFAULT_PATH_ITEMS, DEFAULT_PATH_TILES } from '@app/constants/path';
import { Item } from '@common/enums';
import { Cell } from '@common/board';

@Component({
    selector: 'app-board-cell',
    templateUrl: './board-cell.component.html',
    styleUrls: ['./board-cell.component.scss'],
    imports: [CommonModule],
})
export class BoardCellComponent {
    @Input() cell!: Cell;
    readonly srcTiles = DEFAULT_PATH_TILES;
    readonly srcItem = DEFAULT_PATH_ITEMS;
    readonly fileType = '.png';
    showTooltip = false;

    constructor(private toolSelection: ToolSelectionService) {}

    onDrag() {
        this.toolSelection.updateSelectedItem(this.cell.item);
    }
    onDrop(event: DragEvent) {
        event.preventDefault();
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    getItemDescription(type: Item): string {
        return ASSETS_DESCRIPTION.get(type) ?? '';
    }
}
