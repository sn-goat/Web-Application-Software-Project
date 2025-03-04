/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { GameMapService } from '@app/services/code/game-map.service';
import { SocketService } from '@app/services/code/socket.service';
import { Board } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';
import { first } from 'rxjs/operators';

describe('GameMapService', () => {
    let service: GameMapService;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('SocketService', ['shareGameMap']);

        TestBed.configureTestingModule({
            providers: [GameMapService, { provide: SocketService, useValue: spy }],
        });

        service = TestBed.inject(GameMapService);
        socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
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

    it('should not call socketService.shareGameMap if gameMap is empty', () => {
        // Default state is an empty board
        service.shareGameMap();
        expect(socketServiceSpy.shareGameMap).not.toHaveBeenCalled();
    });

    it('should call socketService.shareGameMap with board if gameMap has value', () => {
        const testBoard: Board = {
            _id: '123',
            name: 'Test Map',
            description: 'Test Description',
            size: 10,
            isCTF: false,
            board: [[{ tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 0, y: 0 } }]],
            visibility: Visibility.PRIVATE,
            image: 'test.jpg',
        };

        service.setGameMap(testBoard);
        service.shareGameMap();

        expect(socketServiceSpy.shareGameMap).toHaveBeenCalledWith(testBoard);
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
