import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BoardCell } from '@common/board';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';
import { DEFAULT_PATH_TILES, DEFAULT_PATH_ITEMS } from '@app/constants/path';

@Component({
    selector: 'app-board-cell',
    templateUrl: './board-cell.component.html',
    styleUrls: ['./board-cell.component.scss'],
    imports: [CommonModule],
})
export class BoardCellComponent {
    @Input() cell!: BoardCell;
    readonly srcTiles = DEFAULT_PATH_TILES;
    readonly srcItem = DEFAULT_PATH_ITEMS;
    readonly fileType = '.png';

    constructor(private editToolMouse: EditToolMouse) {}

    onDrag() {
        this.editToolMouse.updateSelectedItem(this.cell.item);
    }
    onDrop(event: DragEvent) {
        event.preventDefault();
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }
}
