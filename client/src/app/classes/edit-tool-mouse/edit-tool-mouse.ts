import { Injectable } from '@angular/core';
import { Tile } from '@common/enums';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class EditToolMouse {
    selectedTile$: Observable<Tile | null>;
    private selectedTile = new BehaviorSubject<Tile | null>(null);

    constructor() {
        this.selectedTile$ = this.selectedTile.asObservable();
    }

    updateSelectedTile(selectedTile: Tile) {
        if (this.selectedTile.value === selectedTile) {
            this.selectedTile.next(null);
        } else {
            this.selectedTile.next(selectedTile);
        }
    }
}
