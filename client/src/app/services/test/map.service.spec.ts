import { TestBed } from '@angular/core/testing';
import { Board } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';
import { BehaviorSubject } from 'rxjs';
import { MapService } from '@app/services/code/map.service';

describe('MapService', () => {
    let service: MapService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [MapService], // Corrected to use MapService
        });

        service = TestBed.inject(MapService);

        // Mock BehaviorSubject and its initial value

        service['firstBoardValue'] = new BehaviorSubject<Board>({
            _id: '123',
            name: 'Mock Board',
            size: 10,
            isCTF: true,
            description: 'Mock Description',
            visibility: Visibility.PUBLIC,
            image: 'mock.jpg',
            lastUpdatedAt: new Date(),
            board: [],
        });

        service.initializeBoard();

        service['storageKey'] = 'mockStorageKey';
    });

    it('should initialize board with data', () => {
        // Mock data for firstBoardValue
        const mockFirstBoardValue = {
            _id: '123',
            name: 'Test Board',
            size: 10,
            isCTF: true,
            description: 'Test Description',
            visibility: Visibility.PUBLIC,
            image: 'image.jpg',
            lastUpdatedAt: new Date(),
        } as Board;

        // Initialize the BehaviorSubject for boardToSave
        service['firstBoardValue'].next(mockFirstBoardValue);

        // Call initializeBoard method
        service.initializeBoard();

        // Verify board is properly initialized with rows
        expect(service['boardToSave'].value.board).toBeDefined();
        expect(service['boardToSave'].value.board.length).toBe(mockFirstBoardValue.size);
    });

    it('should set board name', () => {
        const newName = 'Updated Board';

        // Call the setBoardName method
        service.setBoardName(newName);

        // Expect the name of the current board to be updated
        expect(service['boardToSave'].value.name).toBe(newName);
    });

    it('should set board description', () => {
        const newDescription = 'Updated Description';

        // Call the setBoardDescription method
        service.setBoardDescription(newDescription);

        // Expect the description of the current board to be updated
        expect(service['boardToSave'].value.description).toBe(newDescription);
    });

    it('should change tile of the cell', () => {
        const newTile = Tile.WALL;
        const col = 2;
        const row = 3;
        const mockBoard = service['boardToSave'].value;

        // Initialize the mock board with the appropriate dimensions
        mockBoard.board = Array(mockBoard.size)
            .fill(null)
            .map((_, rowIndex) =>
                Array(mockBoard.size)
                    .fill(null)
                    .map((_, colIndex) => ({
                        tile: Tile.FLOOR,
                        item: Item.DEFAULT,
                        position: { x: colIndex, y: rowIndex },
                    })),
            );

        service['boardToSave'].next(mockBoard);
        service.setCellTile(col, row, newTile);
        expect(service['boardToSave'].value.board[row][col].tile).toBe(newTile);
    });

    it('should change tile of the cell', () => {
        const newTile = Tile.WALL;
        const col = 2;
        const row = 3;
        const mockBoard = service['boardToSave'].value;
        mockBoard.board = Array(mockBoard.size)
            .fill(null)
            .map(() => Array(mockBoard.size).fill({ tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 0, y: 0 } }));

        mockBoard.board[row][col] = { tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: col, y: row } };
        service['boardToSave'].next(mockBoard);
        service.setCellTile(col, row, newTile);
        expect(service['boardToSave'].value.board[row][col].tile).toBe(newTile);
    });

    it('should generate board if board is undefined', () => {
        const mockBoard = service['boardToSave'].value;
        mockBoard.board = [];
        service['boardToSave'].next(mockBoard);

        service.initializeBoard();

        expect(service['boardToSave'].value.board.length).toBeGreaterThan(0);
    });
});
