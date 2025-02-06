import { Injectable } from '@angular/core';
import { GameMap } from '@app/components/map-list/map-list.component';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    private mapData = new BehaviorSubject<GameMap>({} as GameMap);
    setMapData(data: GameMap): void {
        this.mapData.next(data);
    }

    getMapData(): BehaviorSubject<GameMap> {
        return this.mapData;
    }
}
