import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Board } from '@common/board';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class BoardService {
    private readonly apiUrl = 'http://localhost:3000/api/board'; // Update if hosted elsewhere

    constructor(private readonly http: HttpClient) {}

    getAllBoards(): Observable<Board[]> {
        return this.http.get<Board[]>(`${this.apiUrl}/`);
    }

    getBoard(name: string): Observable<Board> {
        return this.http.get<Board>(`${this.apiUrl}/${name}`);
    }

    addBoard(board: Partial<Board>): Observable<HttpResponse<any>> {
        return this.http.post<HttpResponse<any>>(`${this.apiUrl}/board`, board, { observe: "response" });
    }

    updateBoard(name: string, updates: Partial<Board>): Observable<Board> {
        return this.http.patch<Board>(`${this.apiUrl}/${name}`, updates);
    }

    toggleVisibility(name: string): Observable<Board> {
        return this.http.patch<Board>(`${this.apiUrl}/visibility/${name}`, {});
    }

    deleteBoardByName(name: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${name}`);
    }

    deleteAllBoards(): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/`);
    }
}
