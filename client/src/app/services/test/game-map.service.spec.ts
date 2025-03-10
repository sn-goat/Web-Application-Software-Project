/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { GameMapService } from '@app/services/code/game-map.service';
import { SocketService } from '@app/services/code/socket.service';
import { MockSocketService } from '@app/helpers/mockSocketService';
import { Board } from '@common/board';
import { Visibility } from '@common/enums';
import { first } from 'rxjs/operators';

describe('GameMapService', () => {
    let service: GameMapService;
    let mockSocketService: MockSocketService;

    beforeEach(() => {
        mockSocketService = new MockSocketService();

        TestBed.configureTestingModule({
            providers: [GameMapService, { provide: SocketService, useValue: mockSocketService }],
        });

        service = TestBed.inject(GameMapService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize with an empty board', () => {
        service
            .getGameMap()
            .pipe(first())
            .subscribe((board) => {
                expect(board).toEqual({} as Board);
            });
    });

    it('should set game map correctly', () => {
        const testBoard: Board = {
            _id: '123',
            name: 'Test Map',
            description: 'Test Description',
            size: 10,
            isCTF: false,
            board: [],
            visibility: Visibility.PRIVATE,
            image: 'test.jpg',
        };

        service.setGameMap(testBoard);

        service
            .getGameMap()
            .pipe(first())
            .subscribe((board) => {
                expect(board).toEqual(testBoard);
            });
    });

    it('should return the correct game map size', () => {
        const testBoard: Board = {
            _id: '123',
            name: 'Test Map',
            description: 'Test Description',
            size: 15,
            isCTF: false,
            board: [],
            visibility: Visibility.PRIVATE,
            image: 'test.jpg',
        };

        service.setGameMap(testBoard);

        const size = service.getGameMapSize();
        expect(size).toBe(15);
    });

    it('should handle getGameMapSize when board has no size property', () => {
        // Create a board without size property and cast to Board using unknown as an intermediate step
        const incompleteBoard = {
            _id: '123',
            name: 'Test Map',
            description: 'Test Description',
            isCTF: false,
            board: [],
            visibility: Visibility.PRIVATE,
            image: 'test.jpg',
        } as unknown as Board;

        service.setGameMap(incompleteBoard);

        const size = service.getGameMapSize();
        expect(size).toBe(0);
    });

    it('should return the game map BehaviorSubject', () => {
        const testBoard: Board = {
            _id: '123',
            name: 'Test Map',
            description: 'Test Description',
            size: 10,
            isCTF: false,
            board: [],
            visibility: Visibility.PRIVATE,
            image: 'test.jpg',
        };

        service.setGameMap(testBoard);

        const gameMapSubject = service.getGameMap();
        expect(gameMapSubject.getValue()).toEqual(testBoard);
    });
});
