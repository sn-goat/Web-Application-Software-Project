import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy } from '@angular/core';
import { ItemType } from '@common/enums';
import { BoardCell } from '@common/board';
import { Vec2 } from '@common/vec2';
import { EditDragDrop } from '@app/classes/edit-drag-drop/edit-drag-drop';
import { Subject } from 'rxjs';
import { DEFAULT_PATH_TILES, DEFAULT_PATH_ITEMS } from '@app/constants/path';

@Component({
    selector: 'app-board-cell',
    templateUrl: './board-cell.component.html',
    styleUrls: ['./board-cell.component.scss'],
    imports: [CommonModule],
})
export class BoardCellComponent implements OnDestroy {
    @Input() isMouseRightDown!: boolean;
    @Input() isMouseLeftDown!: boolean;
    @Input() cell!: BoardCell;
    @Input() itemMap: Map<ItemType, Vec2[]>;
    @Input() board: BoardCell[][];

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
        const item = this.editDragDrop.getCurrentItem();
        if (item) {
            if (this.cell.item !== item) {
                this.editDragDrop.removeWasDragged(this.cell.item);
            }
            this.editDragDrop.addWasDragged(item);
            this.cell.item = item as ItemType;
            const itemPositions = this.itemMap.get(this.cell.item);
            if (itemPositions) {
                itemPositions.push(this.cell.position);
                const pos = itemPositions[0];
                if (pos.x !== -1 && pos.y !== -1) {
                    this.board[pos.x][pos.y].item = ItemType.Default;
                }
                itemPositions.shift();
                this.itemMap.set(this.cell.item, itemPositions);
            }
        }
        this.editDragDrop.setCurrentItem('');
    }

    onDragStart(event: DragEvent) {
        event.preventDefault();
        this.editDragDrop.setCurrentItem(this.cell.item);
    }
}
