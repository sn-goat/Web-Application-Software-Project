import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Vec2 } from '@common/vec2';

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
        // console.log(this.currentCoord);
        this.currentCoord.next({ x: event.pageX, y: event.pageY });
    }

    preventRightClick(event: MouseEvent) {
        event.preventDefault();
    }
}
