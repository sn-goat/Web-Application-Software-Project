import { Injectable } from '@angular/core';
import { Board } from '@common/board';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    private readonly storageKey = 'mapData';
    private mapData: BehaviorSubject<Board>;

    constructor() {
        const savedData = localStorage.getItem(this.storageKey);
        const initialData = savedData ? JSON.parse(savedData) : ({} as Board);
        this.mapData = new BehaviorSubject<Board>(initialData);
    }

    setMapData(data: Board): void {
        this.mapData.next(data);
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    getMapData(): BehaviorSubject<Board> {
        return this.mapData;
    }
}
