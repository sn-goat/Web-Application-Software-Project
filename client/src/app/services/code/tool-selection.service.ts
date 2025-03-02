import { Injectable } from '@angular/core';
import { Item, Tile } from '@common/enums';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ToolSelectionService {
    selectedTile$: Observable<Tile | null>;
    selectedItem$: Observable<Item | null>;

    private selectedTile = new BehaviorSubject<Tile | null>(null);
    private selectedItem = new BehaviorSubject<Item | null>(null);

    constructor() {
        this.selectedTile$ = this.selectedTile.asObservable();
        this.selectedItem$ = this.selectedItem.asObservable();
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

    updateSelectedItem(selectedItem: Item) {
        this.selectedItem.next(selectedItem);
    }

    getSelectedItem() {
        return this.selectedItem.value;
    }
}
