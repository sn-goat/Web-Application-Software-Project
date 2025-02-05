import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
// import { Subject } from 'rxjs';
import { ItemType } from '@common/enums';
import { BoardCell } from '@common/board';
import { Vec2 } from '@common/vec2';
// import { EditDragDrop } from '@app/classes/edit-drag-drop/edit-drag-drop';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';
import { DEFAULT_PATH_TILES, DEFAULT_PATH_ITEMS } from '@app/constants/path';

@Component({
    selector: 'app-board-cell',
    templateUrl: './board-cell.component.html',
    styleUrls: ['./board-cell.component.scss'],
    imports: [CommonModule],
})
export class BoardCellComponent {
    @Input() isMouseRightDown!: boolean;
    @Input() isMouseLeftDown!: boolean;
    @Input() cell!: BoardCell;
    @Input() itemMap: Map<ItemType, Vec2[]>;
    @Input() board: BoardCell[][];
    readonly srcTiles = DEFAULT_PATH_TILES;
    readonly srcItem = DEFAULT_PATH_ITEMS;
    readonly fileType = '.png';
    readonly itemType = ItemType;
    // private destroy$ = new Subject<void>();

    constructor(
        // private editDragDrop: EditDragDrop,
        private editToolMouse: EditToolMouse,
    ) {}

    // ngOnDestroy() {
    //     this.destroy$.next();
    //     this.destroy$.complete();
    // }

    // onDragOver(event: DragEvent) {
    //     event.preventDefault();
    // }
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
