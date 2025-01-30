import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class EditToolMouse {
    isTile$: Observable<boolean>;
    selectedTool$: Observable<string>;
    private isTile = new BehaviorSubject<boolean>(false);
    private selectedTool = new BehaviorSubject<string>('');

    constructor() {
        this.isTile$ = this.isTile.asObservable();
        this.selectedTool$ = this.selectedTool.asObservable();
    }

    updateIsTile(isTile: boolean) {
        this.isTile.next(isTile);
    }

    updateSelectedTool(selectedUrl: string) {
        if (this.selectedTool.value === selectedUrl) {
            this.selectedTool.next('');
        } else {
            this.selectedTool.next(selectedUrl);
        }
    }
}
