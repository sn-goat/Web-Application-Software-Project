import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BoardService } from '@app/services/board/board.service';
import { Board } from '@common/board';
import { Visibility } from '@common/enums';

describe('BoardService', () => {
    let service: BoardService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:3000/api/board';

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [BoardService, provideHttpClient(), provideHttpClientTesting()],
        });

        service = TestBed.inject(BoardService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should fetch board by name', () => {
        const mockBoard = {
            _id: '123',
            name: 'Test Board',
            size: 10,
            isCTF: true,
            description: 'Test Description',
            visibility: Visibility.Public,
            updatedAt: new Date(),
        } as Board;

        service.getBoard('Test Board').subscribe((board) => {
            expect(board).toEqual(mockBoard);
        });

        const req = httpMock.expectOne(`${apiUrl}/Test Board`);
        expect(req.request.method).toBe('GET');
        req.flush(mockBoard);
    });

    it('should add a new board', () => {
        const mockBoard: Partial<Board> = {
            name: 'New Board',
            size: 12,
            isCTF: false,
            description: 'New Board Description',
        };

        service.addBoard(mockBoard).subscribe();

        const req = httpMock.expectOne(`${apiUrl}/board`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockBoard);
        req.flush({});
    });

    it('should update a board', () => {
        const mockBoard: Board = {
            _id: '123',
            name: 'New Board',
            size: 12,
            isCTF: false,
            description: 'New Board Description',
            visibility: Visibility.Public,
            updatedAt: new Date(),
            board: [],
        };

        service.updateBoard(mockBoard).subscribe();

        const req = httpMock.expectOne(`${apiUrl}/`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual(mockBoard);
        req.flush({});
    });

    it('should toggle visibility of a board', () => {
        const mockBoard: Partial<Board> = {
            name: 'New Board',
            size: 12,
            isCTF: false,
            description: 'New Board Description',
        };

        service.toggleVisibility('Test Board').subscribe((board) => {
            expect(board.visibility).toBe(Visibility.Public);
        });

        const req = httpMock.expectOne(`${apiUrl}/visibility/Test Board`);
        expect(req.request.method).toBe('PATCH');
        req.flush({ ...mockBoard, visibility: Visibility.Public });
    });

    it('should delete a board by name', () => {
        service.deleteBoardByName('Test Board').subscribe();

        const req = httpMock.expectOne(`${apiUrl}/Test Board`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});
    });

    it('should delete all boards', () => {
        service.deleteAllBoards().subscribe();

        const req = httpMock.expectOne(`${apiUrl}/`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});
    });
});
