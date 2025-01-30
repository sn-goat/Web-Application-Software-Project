import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ITEM_URL } from '@app/constants/urlMapping';
@Injectable({
    providedIn: 'root',
})
export class EditDragDrop {
    wasDragged$: Observable<string[]>;
    private wasDragged = new BehaviorSubject<string[]>([]);

    constructor() {
        this.wasDragged$ = this.wasDragged.asObservable();
    }

    addWasDragged(wasDragged: string) {
        this.wasDragged.next([...this.wasDragged.value, wasDragged]);
    }

    removeWasDragged(wasDragged: string) {
        this.wasDragged.next(this.wasDragged.value.filter((url) => url !== wasDragged));
    }

    findWasDragged(wasDragged: string) {
        return ITEM_URL.find((url) => url === wasDragged);
    }
}
