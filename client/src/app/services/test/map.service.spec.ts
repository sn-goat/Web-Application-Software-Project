import { TestBed } from '@angular/core/testing';
import { MapService } from '@app/services/code/map.service';
import { ToolSelectionService } from '@app/services/code/tool-selection.service';
import { Board } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';

describe('MapService', () => {
    let service: MapService;
    let toolSelectionServiceSpy: jasmine.SpyObj<ToolSelectionService>;

    const dummyBoard: Board = {
        _id: 'dummyId',
        name: 'Dummy Board',
        description: 'Dummy description',
        size: 10,
        board: [],
        isCTF: false,
        visibility: Visibility.PUBLIC,
        image: 'dummyImage',
        updatedAt: new Date(),
    };

    beforeEach(() => {
        toolSelectionServiceSpy = jasmine.createSpyObj('ToolSelectionService', ['parseBoard']);

        spyOn(localStorage, 'getItem').and.callFake((key: string) => {
            if (key === 'firstBoardValue') {
                return JSON.stringify(dummyBoard);
            }
            return null;
        });
        spyOn(localStorage, 'setItem');

        TestBed.configureTestingModule({
            providers: [MapService, { provide: ToolSelectionService, useValue: toolSelectionServiceSpy }],
        });
        service = TestBed.inject(MapService);
        service.initializeBoard();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize board with data', () => {
        const mockFirstBoardValue = {
            _id: '123',
            name: 'Test Board',
            size: 15,
            isCTF: true,
            description: 'Test Description',
            visibility: Visibility.PUBLIC,
            image: 'image.jpg',
            updatedAt: new Date(),
        } as Board;

        service['firstBoardValue'].next(mockFirstBoardValue);
        service.initializeBoard();

        expect(service['boardToSave'].value.board).toBeDefined();
        expect(service['boardToSave'].value.board.length).toBe(mockFirstBoardValue.size);
    });

    it('should generate board if board is undefined', () => {
        const mockBoard = service['boardToSave'].value;
        mockBoard.board = [];
        service['boardToSave'].next(mockBoard);

        service.initializeBoard();

        const boardToSave = service.getBoardToSave().value;
        expect(boardToSave.board.length).toEqual(dummyBoard.size);
        boardToSave.board.forEach((row) => {
            expect(row.length).toEqual(dummyBoard.size);
            row.forEach((cell, colIndex) => {
                expect(cell.tile).toEqual(Tile.FLOOR);
                expect(cell.item).toEqual(Item.DEFAULT);
                expect(cell.position).toEqual({ x: colIndex, y: row[0].position.y });
            });
        });

        expect(service['boardToSave'].value.board.length).toBeGreaterThan(0);
    });

    it('setMapData should update firstBoardValue and localStorage', () => {
        const newBoard: Board = {
            _id: 'dummyId',
            name: 'Updated Board',
            description: 'Updated description',
            size: 3,
            board: [],
            isCTF: true,
            visibility: Visibility.PUBLIC,
            image: 'dummyImage',
            updatedAt: new Date(),
        };
        service.setMapData(newBoard);
        expect(localStorage.setItem).toHaveBeenCalledWith('firstBoardValue', JSON.stringify(newBoard));
        expect(service.getFirstBoardValue()).toEqual(newBoard);
    });

    it('getBoardSize should return board size', () => {
        expect(service.getBoardSize()).toEqual(dummyBoard.size);
    });

    it('getCellTile should return the tile at specified cell', () => {
        const tile = service.getCellTile(0, 0);
        expect(tile).toEqual(Tile.FLOOR);
    });

    it('getCellItem should return the item at specified cell', () => {
        const item = service.getCellItem(0, 0);
        expect(item).toEqual(Item.DEFAULT);
    });

    it('getMode should return isCTF flag', () => {
        expect(service.getMode()).toEqual(dummyBoard.isCTF);
    });

    it('setBoardName should update the board name', () => {
        const newName = 'New Board Name';
        service.setBoardName(newName);
        expect(service.getBoardToSave().value.name).toEqual(newName);
    });

    it('should call boardToSave.next with updated board in setBoardName', () => {
        const boardSubject = service.getBoardToSave();
        const spyNext = spyOn(boardSubject, 'next').and.callThrough();
        const newName = 'New Board Name';
        service.setBoardName(newName);
        expect(spyNext).toHaveBeenCalledWith(jasmine.objectContaining({ name: newName }));
    });

    it('setBoardDescription should update the board description', () => {
        const newDesc = 'New Description';
        service.setBoardDescription(newDesc);
        expect(service.getBoardToSave().value.description).toEqual(newDesc);
    });

    it('should call boardToSave.next with updated board in setBoardDescription', () => {
        const boardSubject = service.getBoardToSave();
        const spyNext = spyOn(boardSubject, 'next').and.callThrough();
        const newDesc = 'New Description';
        service.setBoardDescription(newDesc);
        expect(spyNext).toHaveBeenCalledWith(jasmine.objectContaining({ description: newDesc }));
    });

    it('should change tile of the cell', () => {
        const newTile = Tile.WALL;
        const col = 2;
        const row = 3;
        const mockBoard = service['boardToSave'].value;

        mockBoard.board = Array(mockBoard.size)
            .fill(null)
            .map((_, rowIndex) =>
                Array(mockBoard.size)
                    .fill(null)
                    .map((__, colIndex) => ({
                        tile: Tile.FLOOR,
                        item: Item.DEFAULT,
                        position: { x: colIndex, y: rowIndex },
                    })),
            );

        service['boardToSave'].next(mockBoard);
        service.setCellTile(col, row, newTile);
        expect(service['boardToSave'].value.board[row][col].tile).toBe(newTile);
    });

    it('should change item of the cell', () => {
        const newItem = Item.FLAG;
        const col = 1;
        const row = 1;
        const mockBoard = service['boardToSave'].value;

        mockBoard.board = Array(mockBoard.size)
            .fill(null)
            .map((_, rowIndex) =>
                Array(mockBoard.size)
                    .fill(null)
                    .map((__, colIndex) => ({
                        tile: Tile.FLOOR,
                        item: Item.DEFAULT,
                        position: { x: colIndex, y: rowIndex },
                    })),
            );

        service['boardToSave'].next(mockBoard);
        service.setCellItem(col, row, newItem);
        expect(service['boardToSave'].value.board[row][col].item).toBe(newItem);
    });

    describe('setBoardToFirstValue', () => {
        it('should generate a board if firstBoardValue.board is empty', () => {
            const emptyBoard: Board = {
                _id: 'empty',
                name: 'Empty Board',
                description: '',
                size: 5,
                board: [],
                isCTF: false,
                visibility: Visibility.PRIVATE,
                image: '',
                updatedAt: new Date(),
            };
            service['firstBoardValue'].next(emptyBoard);
            toolSelectionServiceSpy.parseBoard.calls.reset();
            service.setBoardToFirstValue();
            const boardToSave = service.getBoardToSave().value;
            expect(boardToSave.board).toBeDefined();
            expect(Array.isArray(boardToSave.board)).toBeTrue();
            expect(toolSelectionServiceSpy.parseBoard).not.toHaveBeenCalled();
        });

        it('should set boardToSave to firstBoardValue and call parseBoard when board is not empty', () => {
            const nonEmptyBoard: Board = {
                _id: 'nonEmpty',
                name: 'Non Empty Board',
                description: 'Board is already generated',
                size: 1,
                board: [[{ tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 0, y: 0 } }]],
                isCTF: true,
                visibility: Visibility.PUBLIC,
                image: 'img',
                updatedAt: new Date(),
            };
            service['firstBoardValue'].next(nonEmptyBoard);
            toolSelectionServiceSpy.parseBoard.calls.reset();
            service.setBoardToFirstValue();
            const boardToSave = service.getBoardToSave().value;
            expect(boardToSave).toEqual(nonEmptyBoard);
            expect(toolSelectionServiceSpy.parseBoard).toHaveBeenCalledWith(nonEmptyBoard);
        });
    });
});
