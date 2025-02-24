import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Board } from '@common/board';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class BoardService {
    private readonly apiUrl = environment.serverUrl + '/board'; // Update if hosted elsewhere

    constructor(private readonly http: HttpClient) {}

    getAllBoards(): Observable<Board[]> {
        return this.http.get<Board[]>(`${this.apiUrl}/`);
    }

    getBoard(name: string): Observable<Board> {
        return this.http.get<Board>(`${this.apiUrl}/${name}`);
    }

    addBoard(board: Partial<Board>): Observable<HttpResponse<unknown>> {
        return this.http.post<HttpResponse<unknown>>(`${this.apiUrl}/board`, board, { observe: 'response' });
    }

    updateBoard(board: Board): Observable<HttpResponse<unknown>> {
        return this.http.patch<HttpResponse<unknown>>(`${this.apiUrl}/`, board);
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
