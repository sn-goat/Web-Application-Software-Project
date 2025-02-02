import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BoardCell } from '@common/board';
import { ItemType } from '@common/enums';
import { Vec2 } from '@common/vec2';
import { ITEMS_TYPES } from '@app/constants/types';

@Injectable({
    providedIn: 'root',
})
export class EditDragDrop {
    wasDragged$: Observable<string[]>;
    currentItem$: Observable<string>;
    mousePosition$: Observable<Vec2>;
    itemOutsideBoard$: Observable<string>;

    private isSet = false;
    private mousePosition = new BehaviorSubject<Vec2>({ x: -1, y: -1 });
    private wasDragged = new BehaviorSubject<string[]>([]);
    private currentItem = new BehaviorSubject<string>('');
    private itemOutsideBoard = new BehaviorSubject<string>('');

    constructor() {
        this.wasDragged$ = this.wasDragged.asObservable();
        this.currentItem$ = this.currentItem.asObservable();
        this.mousePosition$ = this.mousePosition.asObservable();
        this.itemOutsideBoard$ = this.itemOutsideBoard.asObservable();
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

    setCurrentPosition(position: Vec2) {
        this.mousePosition.next(position);
    }

    getCurrentPosition() {
        return this.mousePosition.value;
    }

    getItemOutsideBoard() {
        return this.itemOutsideBoard.value;
    }

    setItemOutsideBoard(item: string) {
        this.itemOutsideBoard.next(item);
    }

    onDrop(board: BoardCell[][], cell: BoardCell, itemMap: Map<string, Vec2[]>) {
        const item = this.getCurrentItem();
        if (this.isSet) {
            this.handleItemDrop(item, board, cell, itemMap);
            this.setCurrentItem('');
        }
    }

    onDragLeave(board: BoardCell[][], itemMap: Map<string, Vec2[]>) {
        this.onDropOutsideBoard();
        const item = this.getItemOutsideBoard();
        if (item !== ItemType.Default) {
            this.removeWasDragged(item);
            const itemPositions = itemMap.get(item as ItemType);
            let pos;
            if (itemPositions) {
                pos = itemPositions[0];
                if (pos) {
                    board[pos.x][pos.y].item = ItemType.Default;
                }
                itemPositions.push({ x: -1, y: -1 });
                itemPositions.shift();
                itemMap.set(item as ItemType, itemPositions);
            }
            this.setItemOutsideBoard('');
        }
    }

    addWasDragged(wasDragged: string) {
        this.wasDragged.next([...this.wasDragged.value, wasDragged]);
    }

    removeWasDragged(wasDragged: string) {
        this.wasDragged.next(this.wasDragged.value.filter((url) => url !== wasDragged));
    }

    private onDropOutsideBoard() {
        if (this.getCurrentPosition().x === -1 || this.getCurrentPosition().y === -1) {
            this.setItemOutsideBoard(this.currentItem.value);
        }
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

    private handleItemDrop(item: string, board: BoardCell[][], cell: BoardCell, itemMap: Map<string, Vec2[]>) {
        if (cell.item !== item && cell.item !== ItemType.Default) {
            this.handleExistingItemRemoval(cell, itemMap);
        }

        this.updateItemState(item, cell);
        this.updateItemPositions(item, cell, itemMap, board);
    }

    private updateItemState(item: string, cell: BoardCell) {
        this.addWasDragged(item);
        cell.item = item as ItemType;
    }

    private updateItemPositions(item: string, cell: BoardCell, itemMap: Map<string, Vec2[]>, board: BoardCell[][]) {
        const itemPositions = itemMap.get(item);
        if (itemPositions) {
            itemPositions.push(cell.position);
            this.clearOldPosition(itemPositions, board);
            itemPositions.shift();
            itemMap.set(item, itemPositions);
        }
    }

    private clearOldPosition(itemPositions: Vec2[], board: BoardCell[][]) {
        const pos1 = itemPositions[0];
        const pos2 = itemPositions[1];
        if (pos1 === pos2) {
            return;
        }
        if (pos1.x !== -1 && pos1.y !== -1) {
            board[pos1.x][pos1.y].item = ItemType.Default;
        }
    }
}
