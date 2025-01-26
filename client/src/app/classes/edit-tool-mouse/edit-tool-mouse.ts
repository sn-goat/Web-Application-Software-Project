import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class EditToolMouse {
    isTile$: Observable<boolean>;
    selectedUrl$: Observable<string>;
    private isTile = new BehaviorSubject<boolean>(false);
    private selectedUrl = new BehaviorSubject<string>('');

    constructor() {
        this.isTile$ = this.isTile.asObservable();
        this.selectedUrl$ = this.selectedUrl.asObservable();
    }

    updateIsTile(isTile: boolean) {
        this.isTile.next(isTile);
    }

    updateSelectedUrl(selectedUrl: string) {
        if (this.selectedUrl.value === selectedUrl) {
            this.selectedUrl.next('');
        } else {
            this.selectedUrl.next(selectedUrl);
        }
    }
}
