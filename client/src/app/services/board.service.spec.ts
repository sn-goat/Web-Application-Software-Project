import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Board } from '@common/board'; // Remplacez par votre modèle
import { Visibility } from '@common/enums'; // Remplacez par votre modèle d'énumération
import { BoardService } from './board.service';

describe('BoardService', () => {
    let service: BoardService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:3000/api/board';

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [BoardService, provideHttpClient(), provideHttpClientTesting() ],
        });

        service = TestBed.inject(BoardService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify(); // Assurez-vous de vérifier après chaque test
    });

    it('should fetch board by name', () => {
        const mockBoard = {
            _id: '123',
            name: 'Test Board',
            size: 10,
            isCTF: true,
            description: 'Test Description',
            visibility: Visibility.PUBLIC,
            image: 'image.jpg',
            lastUpdatedAt: new Date()
        } as Board;

        service.getBoard('Test Board').subscribe(board => {
            expect(board).toEqual(mockBoard);
        });

        const req = httpMock.expectOne(`${apiUrl}/Test Board`);
        expect(req.request.method).toBe('GET');
        req.flush(mockBoard); // Simule la réponse du serveur
    });

    it('should add a new board', () => {
        const mockBoard: Partial<Board> = {
            name: 'New Board',
            size: 12,
            isCTF: false,
            description: 'New Board Description'
        };

        service.addBoard(mockBoard).subscribe();

        const req = httpMock.expectOne(`${apiUrl}/board`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockBoard);
        req.flush({}); // Simule la réponse du serveur
    });

    it('should update a board', () => {
        const updates: Partial<Board> = { description: 'Updated Description' };

        service.updateBoard('Test Board', updates).subscribe(board => {
            expect(board.name).toBe('Test Board');
            expect(board.description).toBe('Updated Description');
        });

        const req = httpMock.expectOne(`${apiUrl}/Test Board`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual(updates);
        req.flush({ name: 'Test Board', description: 'Updated Description' });
    });

    it('should toggle visibility of a board', () => {
        const mockBoard: Partial<Board> = {
            name: 'New Board',
            size: 12,
            isCTF: false,
            description: 'New Board Description'
        };

        service.toggleVisibility('Test Board').subscribe(board => {
            expect(board.visibility).toBe(Visibility.PUBLIC); // Assuming visibility is toggled to public
        });

        const req = httpMock.expectOne(`${apiUrl}/visibility/Test Board`);
        expect(req.request.method).toBe('PATCH');
        req.flush({ ...mockBoard, visibility: Visibility.PUBLIC });
    });

    it('should delete a board by name', () => {
        service.deleteBoardByName('Test Board').subscribe();

        const req = httpMock.expectOne(`${apiUrl}/Test Board`);
        expect(req.request.method).toBe('DELETE');
        req.flush({}); // Simule la réponse du serveur
    });

    it('should delete all boards', () => {
        service.deleteAllBoards().subscribe();

        const req = httpMock.expectOne(`${apiUrl}/`);
        expect(req.request.method).toBe('DELETE');
        req.flush({}); // Simule la réponse du serveur
    });
});
