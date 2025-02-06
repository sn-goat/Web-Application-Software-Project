import { Injectable } from '@angular/core';
import { Board } from '@common/board';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    private mapData = new BehaviorSubject<Board>({} as Board);
    setMapData(data: Board): void {
        this.mapData.next(data);
    }

    getMapData(): BehaviorSubject<Board> {
        return this.mapData;
    }
}
