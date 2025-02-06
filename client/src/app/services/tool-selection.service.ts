import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TileType, ItemType } from '@common/enums';

@Injectable({
    providedIn: 'root',
})
export class ToolSelectionService {
    selectedTile$: Observable<TileType | null>;
    selectedItem$: Observable<ItemType | null>;
    itemOnBoard$: Observable<Set<ItemType>>;
    nbrSpawnOnBoard$: Observable<number>;
    nbrChestOnBoard$: Observable<number>;

    private selectedTile = new BehaviorSubject<TileType | null>(null);
    private selectedItem = new BehaviorSubject<ItemType | null>(null);
    private itemOnBoard = new BehaviorSubject<Set<ItemType>>(new Set());
    private nbrSpawnOnBoard = new BehaviorSubject<number>(0);
    private nbrChestOnBoard = new BehaviorSubject<number>(0);

    constructor() {
        this.selectedTile$ = this.selectedTile.asObservable();
        this.selectedItem$ = this.selectedItem.asObservable();
        this.itemOnBoard$ = this.itemOnBoard.asObservable();
        this.nbrSpawnOnBoard$ = this.nbrSpawnOnBoard.asObservable();
        this.nbrChestOnBoard$ = this.nbrChestOnBoard.asObservable();
    }

    updateSelectedTile(selectedTile: TileType) {
        if (this.selectedTile.value === selectedTile) {
            this.selectedTile.next(null);
        } else {
            this.selectedTile.next(selectedTile);
        }
    }

    updateSelectedItem(selectedItem: ItemType) {
        this.selectedItem.next(selectedItem);
    }

    addItem(item: ItemType) {
        this.itemOnBoard.next(this.itemOnBoard.value.add(item));
    }

    removeItem(item: ItemType) {
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
}
