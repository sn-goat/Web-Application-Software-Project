import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class PopupService {
    private popupVisibleSubject = new BehaviorSubject<boolean>(false);

    get popupVisible$(): Observable<boolean> {
        return this.popupVisibleSubject.asObservable();
    }

    setPopupVisible(isVisible: boolean): void {
        this.popupVisibleSubject.next(isVisible);
    }

    togglePopup(): void {
        this.popupVisibleSubject.next(!this.popupVisibleSubject.value);
    }
}
