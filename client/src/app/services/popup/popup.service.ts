import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class PopupService {
    private popupVisibleSubject = new BehaviorSubject<boolean>(false);
    private chatInputFocusedSubject = new BehaviorSubject<boolean>(false);

    get popupVisible$(): Observable<boolean> {
        return this.popupVisibleSubject.asObservable();
    }

    get chatInputFocused$(): Observable<boolean> {
        return this.chatInputFocusedSubject.asObservable();
    }

    setPopupVisible(isVisible: boolean): void {
        this.popupVisibleSubject.next(isVisible);
    }

    setChatInputFocused(isFocused: boolean): void {
        this.chatInputFocusedSubject.next(isFocused);
    }

    togglePopup(): void {
        this.popupVisibleSubject.next(!this.popupVisibleSubject.value);
    }
}
