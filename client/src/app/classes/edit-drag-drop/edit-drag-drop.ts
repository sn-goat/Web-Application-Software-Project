import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
}
