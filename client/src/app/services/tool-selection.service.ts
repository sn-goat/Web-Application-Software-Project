import { Injectable } from '@angular/core';
import { Board } from '@common/board';
import { Item, Tile } from '@common/enums';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ToolSelectionService {
    selectedTile$: Observable<Tile | null>;
    selectedItem$: Observable<Item | null>;
    itemOnBoard$: Observable<Set<Item>>;
    nbrSpawnOnBoard$: Observable<number>;
    nbrChestOnBoard$: Observable<number>;

    private selectedTile = new BehaviorSubject<Tile | null>(null);
    private selectedItem = new BehaviorSubject<Item | null>(null);
    private itemOnBoard = new BehaviorSubject<Set<Item>>(new Set());
    private nbrSpawnOnBoard = new BehaviorSubject<number>(0);
    private nbrChestOnBoard = new BehaviorSubject<number>(0);
    private isReadyToSave = false;

    constructor() {
        this.selectedTile$ = this.selectedTile.asObservable();
        this.selectedItem$ = this.selectedItem.asObservable();
        this.itemOnBoard$ = this.itemOnBoard.asObservable();
        this.nbrSpawnOnBoard$ = this.nbrSpawnOnBoard.asObservable();
        this.nbrChestOnBoard$ = this.nbrChestOnBoard.asObservable();
    }

    updateSelectedTile(selectedTile: Tile) {
        if (this.selectedTile.value === selectedTile) {
            this.selectedTile.next(null);
        } else {
            this.selectedTile.next(selectedTile);
        }
    }

    getIsReadyToSave() {
        return this.isReadyToSave;
    }

    setIsReadyToSave(isReady: boolean) {
        this.isReadyToSave = isReady;
    }

    updateSelectedItem(selectedItem: Item) {
        this.selectedItem.next(selectedItem);
    }

    addItem(item: Item) {
        this.itemOnBoard.next(this.itemOnBoard.value.add(item));
    }

    removeItem(item: Item) {
        this.itemOnBoard.next(this.itemOnBoard.value.delete(item) ? this.itemOnBoard.value : this.itemOnBoard.value);
    }

    incrementSpawn() {
        this.nbrSpawnOnBoard.next(this.nbrSpawnOnBoard.value + 1);
    }

    decrementSpawn() {
        this.nbrSpawnOnBoard.next(this.nbrSpawnOnBoard.value - 1);
    }

    incrementChest() {
        this.nbrChestOnBoard.next(this.nbrChestOnBoard.value + 1);
    }

    decrementChest() {
        this.nbrChestOnBoard.next(this.nbrChestOnBoard.value - 1);
    }

    parseBoard(board: Board) {
        board.board.forEach((row) => {
            row.forEach((cell) => {
                if (cell.item !== Item.DEFAULT) {
                    if (cell.item === Item.CHEST) {
                        this.decrementChest();
                    } else if (cell.item === Item.SPAWN) {
                        this.decrementSpawn();
                    } else {
                        this.addItem(cell.item);
                    }
                }
            });
        });
    }
}
