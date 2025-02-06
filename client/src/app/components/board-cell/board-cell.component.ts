import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy } from '@angular/core';
import { EditDragDrop } from '@app/classes/edit-drag-drop/edit-drag-drop';
import { DEFAULT_PATH_ITEMS, DEFAULT_PATH_TILES } from '@app/constants/path';
import { Cell } from '@common/board';
import { Item } from '@common/enums';
import { Vec2 } from '@common/vec2';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-board-cell',
    templateUrl: './board-cell.component.html',
    styleUrls: ['./board-cell.component.scss'],
    imports: [CommonModule],
})
export class BoardCellComponent implements OnDestroy {
    @Input() isMouseRightDown!: boolean;
    @Input() isMouseLeftDown!: boolean;
    @Input() cell!: Cell;
    @Input() itemMap: Map<Item, Vec2[]>;
    @Input() board: Cell[][];

    readonly srcTiles = DEFAULT_PATH_TILES;
    readonly srcItem = DEFAULT_PATH_ITEMS;
    readonly fileType = '.png';
    private destroy$ = new Subject<void>();

    constructor(private editDragDrop: EditDragDrop) {}

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.editDragDrop.onDrop(this.board, this.cell, this.itemMap);
    }

    onDragStart(event: DragEvent) {
        event.preventDefault();
        this.editDragDrop.setCurrentItem(this.cell.item);
    }
}
