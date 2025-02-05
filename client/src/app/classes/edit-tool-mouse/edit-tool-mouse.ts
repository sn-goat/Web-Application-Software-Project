import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TileType, ItemType } from '@common/enums';

@Injectable({
    providedIn: 'root',
})
export class EditToolMouse {
    selectedTile$: Observable<TileType | null>;
    selectedItem$: Observable<ItemType | null>;
    private selectedTile = new BehaviorSubject<TileType | null>(null);
    private selectedItem = new BehaviorSubject<ItemType | null>(null);

    constructor() {
        this.selectedTile$ = this.selectedTile.asObservable();
        this.selectedItem$ = this.selectedItem.asObservable();
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
}
