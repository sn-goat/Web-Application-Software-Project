import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Vec2 } from '@common/vec2';

@Injectable({
    providedIn: 'root',
})
export class MouseEditorService {
    currentCoord$: Observable<Vec2>;
    isMouseRightDown$: Observable<boolean>;
    isMouseLeftDown$: Observable<boolean>;
    private currentCoord = new BehaviorSubject<Vec2>({ x: -1, y: -1 });
    private isMouseRightDown = new BehaviorSubject<boolean>(false);
    private isMouseLeftDown = new BehaviorSubject<boolean>(false);

    constructor() {
        this.currentCoord$ = this.currentCoord.asObservable();
        this.isMouseRightDown$ = this.isMouseRightDown.asObservable();
        this.isMouseLeftDown$ = this.isMouseLeftDown.asObservable();
    }

    updateCoordinate(event: MouseEvent | DragEvent) {
        this.currentCoord.next({ x: event.pageX, y: event.pageY });
    }

    handleMouseDown(event: MouseEvent) {
        if (event.button === 2) {
            this.isMouseRightDown.next(true);
        }
        if (event.button === 0) {
            this.isMouseLeftDown.next(true);
        }
    }

    handleMouseUp(event: MouseEvent) {
        if (event.button === 2) {
            this.isMouseRightDown.next(false);
        }
        if (event.button === 0) {
            this.isMouseLeftDown.next(false);
        }
    }

    turnButtonsOff() {
        this.isMouseRightDown.next(false);
        this.isMouseLeftDown.next(false);
    }

    preventRightClick(event: MouseEvent) {
        event.preventDefault();
    }
}
