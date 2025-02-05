import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TileType, ItemType } from '@common/enums';

@Injectable({
    providedIn: 'root',
})
export class ToolSelectionService {
    selectedTile$: Observable<TileType | null>;
    selectedItem$: Observable<ItemType | null>;
    nbrItemOnBoard$: Observable<number>;
    nbrSpawnOnBoard$: Observable<number>;

    private selectedTile = new BehaviorSubject<TileType | null>(null);
    private selectedItem = new BehaviorSubject<ItemType | null>(null);
    private nbrItemOnBoard = new BehaviorSubject<number>(0);
    private nbrSpawnOnBoard = new BehaviorSubject<number>(0);

    constructor() {
        this.selectedTile$ = this.selectedTile.asObservable();
        this.selectedItem$ = this.selectedItem.asObservable();
        this.nbrItemOnBoard$ = this.nbrItemOnBoard.asObservable();
        this.nbrSpawnOnBoard$ = this.nbrSpawnOnBoard.asObservable();
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

    incrementItem() {
        this.nbrItemOnBoard.next(this.nbrItemOnBoard.value + 1);
        console.log('items :', this.nbrItemOnBoard.value, 'spawn :', this.nbrSpawnOnBoard.value);
    }

    decrementItem() {
        this.nbrItemOnBoard.next(this.nbrItemOnBoard.value - 1);
        console.log('items :', this.nbrItemOnBoard.value, 'spawn :', this.nbrSpawnOnBoard.value);
    }

    incrementSpawn() {
        this.nbrSpawnOnBoard.next(this.nbrSpawnOnBoard.value + 1);
        console.log('items :', this.nbrItemOnBoard.value, 'spawn :', this.nbrSpawnOnBoard.value);
    }

    decrementSpawn() {
        this.nbrSpawnOnBoard.next(this.nbrSpawnOnBoard.value - 1);
        console.log('items :', this.nbrItemOnBoard.value, 'spawn :', this.nbrSpawnOnBoard.value);
    }
}
