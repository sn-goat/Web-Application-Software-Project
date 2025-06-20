import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Vec2 } from '@common/board';

@Injectable({
    providedIn: 'root',
})
export class MouseEditorService {
    currentCoord$: Observable<Vec2>;
    private currentCoord = new BehaviorSubject<Vec2>({ x: -1, y: -1 });

    constructor() {
        this.currentCoord$ = this.currentCoord.asObservable();
    }

    updateCoordinate(event: MouseEvent | DragEvent) {
        this.currentCoord.next({ x: event.pageX, y: event.pageY });
    }

    preventRightClick(event: MouseEvent) {
        event.preventDefault();
    }
}
