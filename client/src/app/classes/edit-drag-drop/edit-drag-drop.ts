import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BoardCell } from '../../../../../common/board';
import { ItemType } from '@common/enums';
import { Vec2 } from '@common/vec2';
import { ITEMS_TYPES } from '@app/constants/types';

@Injectable({
    providedIn: 'root',
})
export class EditDragDrop {
    wasDragged$: Observable<string[]>;
    currentItem$: Observable<string>;

    private isSet = false;
    private wasDragged = new BehaviorSubject<string[]>([]);
    private currentItem = new BehaviorSubject<string>('');

    constructor() {
        this.wasDragged$ = this.wasDragged.asObservable();
        this.currentItem$ = this.currentItem.asObservable();
    }

    setCurrentItem(currentItem: string) {
        if (ITEMS_TYPES.includes(currentItem)) {
            this.currentItem.next(currentItem);
            this.isSet = true;
        } else {
            this.isSet = false;
        }
    }

    getCurrentItem() {
        return this.currentItem.value;
    }

    onDrop(board: BoardCell[][], cell: BoardCell, itemMap: Map<string, Vec2[]>) {
        const item = this.getCurrentItem();
        if (this.isSet) {
            this.handleItemDrop(item, board, cell, itemMap);
            this.setCurrentItem('');
        }
    }

    private addWasDragged(wasDragged: string) {
        this.wasDragged.next([...this.wasDragged.value, wasDragged]);
    }

    private removeWasDragged(wasDragged: string) {
        this.wasDragged.next(this.wasDragged.value.filter((url) => url !== wasDragged));
    }

    private handleItemDrop(item: string, board: BoardCell[][], cell: BoardCell, itemMap: Map<string, Vec2[]>) {
        if (cell.item !== item && cell.item !== ItemType.Default) {
            this.handleExistingItemRemoval(cell, itemMap);
        }

        this.updateItemState(item, cell);
        this.updateItemPositions(item, cell, itemMap, board);
    }

    private handleExistingItemRemoval(cell: BoardCell, itemMap: Map<string, Vec2[]>) {
        this.removeWasDragged(cell.item);
        const itemPositions = itemMap.get(cell.item);
        if (itemPositions) {
            itemPositions.push({ x: -1, y: -1 });
            itemPositions.shift();
            itemMap.set(cell.item, itemPositions);
        }
    }

    private updateItemState(item: string, cell: BoardCell) {
        this.addWasDragged(item);
        cell.item = item as ItemType;
    }

    private updateItemPositions(item: string, cell: BoardCell, itemMap: Map<string, Vec2[]>,  board: BoardCell[][]) {
        const itemPositions = itemMap.get(item);
        if (itemPositions) {
            itemPositions.push(cell.position);
            this.clearOldPosition(itemPositions, board);
            itemPositions.shift();
            itemMap.set(item, itemPositions);
        }
    }

    private clearOldPosition(itemPositions: Vec2[], board: BoardCell[][]) {
        const pos = itemPositions[0];
        if (pos.x !== -1 && pos.y !== -1) {
            board[pos.x][pos.y].item = ItemType.Default;
        }
    }
}
