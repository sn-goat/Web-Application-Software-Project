import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BoardGame } from '@app/interfaces/board/board-game';

@Injectable({
    providedIn: 'root',
})
export class BoardService {
    private readonly apiUrl = 'http://localhost:3000/api/board'; // Update if hosted elsewhere

    constructor(private readonly http: HttpClient) {}

    getAllBoards(): Observable<BoardGame[]> {
        return this.http.get<BoardGame[]>(`${this.apiUrl}/`);
    }

    getBoard(name: string): Observable<BoardGame> {
        return this.http.get<BoardGame>(`${this.apiUrl}/${name}`);
    }

    addBoard(board: Partial<BoardGame>): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/board`, board);
    }

    updateBoard(name: string, updates: Partial<BoardGame>): Observable<BoardGame> {
        return this.http.patch<BoardGame>(`${this.apiUrl}/${name}`, updates);
    }

    toggleVisibility(name: string): Observable<BoardGame> {
        return this.http.patch<BoardGame>(`${this.apiUrl}/visibility/${name}`, {});
    }

    deleteBoardByName(name: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${name}`);
    }

    deleteAllBoards(): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/`);
    }
}
