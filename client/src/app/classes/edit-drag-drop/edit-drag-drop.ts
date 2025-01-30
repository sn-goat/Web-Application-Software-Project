import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ITEMS_TYPES } from '@app/constants/types';

@Injectable({
    providedIn: 'root',
})
export class EditDragDrop {
    wasDragged$: Observable<string[]>;
    currentItem$: Observable<string>;

    private wasDragged = new BehaviorSubject<string[]>([]);
    private currentItem = new BehaviorSubject<string>('');

    constructor() {
        this.wasDragged$ = this.wasDragged.asObservable();
        this.currentItem$ = this.currentItem.asObservable();
    }

    addWasDragged(wasDragged: string) {
        this.wasDragged.next([...this.wasDragged.value, wasDragged]);
    }

    removeWasDragged(wasDragged: string) {
        this.wasDragged.next(this.wasDragged.value.filter((url) => url !== wasDragged));
    }

    findWasDragged(wasDragged: string) {
        const itemName = ITEMS_TYPES.find((type) => type === wasDragged);
        if (itemName) {
            return this.wasDragged.value.find((type) => type === itemName);
        }
        return undefined;
    }

    setCurrentItem(currentItem: string) {
        this.currentItem.next(currentItem);
    }

    getCurrentItem() {
        return this.currentItem.value;
    }
}
