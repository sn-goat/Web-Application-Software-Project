import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BoardGame } from '@app/interfaces/board/board-game';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    private readonly apiUrl = 'http://localhost:3000/api/board';

    constructor(private readonly http: HttpClient) {}

    getAllMaps(): Observable<BoardGame[]> {
        return this.http.get<BoardGame[]>(`${this.apiUrl}/`);
    }
}
