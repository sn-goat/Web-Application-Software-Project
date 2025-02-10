import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tile, Item, Size } from '@common/enums';
import { BOARD_SIZE_MAPPING } from '@app/constants/map-size-limitd';

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
    private isSpawnPlaced = false;
    private itemCounter = 0;
    private maxObjectByType: number;
    private boardSize: Size;

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

    getSelectedTile() {
        return this.selectedTile.value;
    }

    setMaxObjectByType(maxObjectByType: number) {
        this.maxObjectByType = maxObjectByType;
    }

    getMaxObjectByType() {
        return this.maxObjectByType;
    }

    setBoardSize(boardSize: Size) {
        this.boardSize = boardSize;
    }

    getBoardSize() {
        return this.boardSize;
    }

    isMinimumObjectPlaced() {
        return this.getItemCounter() >= BOARD_SIZE_MAPPING[this.boardSize];
    }

    getIsSpawnPlaced() {
        return this.isSpawnPlaced;
    }

    getItemCounter() {
        return this.itemCounter;
    }

    setIsSpawnPlaced(isPlaced: boolean) {
        this.isSpawnPlaced = isPlaced;
    }

    updateSelectedItem(selectedItem: Item) {
        this.selectedItem.next(selectedItem);
    }

    getSelectedItem() {
        return this.selectedItem.value;
    }

    addItem(item: Item) {
        if (!this.itemOnBoard.value.has(item)) {
            this.itemOnBoard.next(this.itemOnBoard.value.add(item));
            this.itemCounter++;
        }
    }

    removeItem(item: Item) {
        if (this.itemOnBoard.value.delete(item)) {
            this.itemOnBoard.next(this.itemOnBoard.value);
            this.itemCounter--;
        }
    }

    incrementSpawn() {
        this.nbrSpawnOnBoard.next(this.nbrSpawnOnBoard.value + 1);
    }

    decrementSpawn() {
        this.nbrSpawnOnBoard.next(this.nbrSpawnOnBoard.value - 1);
    }

    incrementChest() {
        this.nbrChestOnBoard.next(this.nbrChestOnBoard.value + 1);
        this.itemCounter++;
    }

    decrementChest() {
        this.nbrChestOnBoard.next(this.nbrChestOnBoard.value - 1);
        this.itemCounter--;
    }
}
