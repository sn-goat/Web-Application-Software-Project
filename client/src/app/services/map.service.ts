import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GameMap } from '@app/components/map-list/map-list.component';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    private readonly apiUrl = 'http://localhost:3000/api/board';

    constructor(private readonly http: HttpClient) {}

    getAllMaps(): Observable<GameMap[]> {
        return this.http.get<GameMap[]>(`${this.apiUrl}/`);
    }
}
