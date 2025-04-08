import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class PopupService {
    private popupVisibleSubject = new BehaviorSubject<boolean>(false);
    popupVisible$: Observable<boolean> = this.popupVisibleSubject.asObservable();

    setPopupVisible(isVisible: boolean): void {
        this.popupVisibleSubject.next(isVisible);
    }

    togglePopup(): void {
        this.popupVisibleSubject.next(!this.popupVisibleSubject.value);
    }
}
