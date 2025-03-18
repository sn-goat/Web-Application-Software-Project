import { CommonModule } from '@angular/common';
import { Component, inject, Input, ViewEncapsulation } from '@angular/core';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_ITEMS, DEFAULT_PATH_TILES } from '@app/constants/path';
import { ToolSelectionService } from '@app/services/code/tool-selection.service';
import { Cell } from '@common/board';
import { Item } from '@common/enums';

@Component({
    selector: 'app-board-cell',
    templateUrl: './board-cell.component.html',
    styleUrls: ['./board-cell.component.scss'],
    imports: [CommonModule],
    encapsulation: ViewEncapsulation.None,
})
export class BoardCellComponent {
    @Input() cell!: Cell;
    @Input() isInGameView = false;
    @Input() tooltipContent: string | null = null;

    readonly srcTiles = DEFAULT_PATH_TILES;
    readonly srcItem = DEFAULT_PATH_ITEMS;
    readonly fileType = DEFAULT_FILE_TYPE;
    showTooltip = false;
    private readonly toolSelectionService = inject(ToolSelectionService);

    onDrag() {
        this.toolSelectionService.updateSelectedItem(this.cell.item);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDragStart(event: DragEvent) {
        if (this.isInGameView) {
            event.preventDefault();
        }
    }

    getItemDescription(type: Item): string | undefined {
        return ASSETS_DESCRIPTION.get(type);
    }
}
