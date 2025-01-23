import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class EditToolMouse {
    isTile$: Observable<boolean>;
    itemUrl$: Observable<string>;
    private isTile = new BehaviorSubject<boolean>(false);
    private itemUrl = new BehaviorSubject<string>('');

    constructor() {
        this.isTile$ = this.isTile.asObservable();
        this.itemUrl$ = this.itemUrl.asObservable();
    }

    updateIsTile(isTile: boolean) {
        this.isTile.next(isTile);
    }

    updateItemUrl(itemUrl: string) {
        this.itemUrl.next(itemUrl);
    }

}