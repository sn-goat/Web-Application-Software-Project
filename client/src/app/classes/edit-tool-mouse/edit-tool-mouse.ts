import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TileType } from '@common/enums';

@Injectable({
    providedIn: 'root',
})
export class EditToolMouse {
    selectedTile$: Observable<TileType | null>;
    private selectedTile = new BehaviorSubject<TileType | null>(null);

    constructor() {
        this.selectedTile$ = this.selectedTile.asObservable();
    }

    updateSelectedTile(selectedTile: TileType) {
        if (this.selectedTile.value === selectedTile) {
            this.selectedTile.next(null);
        } else {
            this.selectedTile.next(selectedTile);
        }
    }
}
