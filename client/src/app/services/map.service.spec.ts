import { TestBed } from '@angular/core/testing';
import { MapService } from './map.service';
import { Board } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';

describe('MapService', () => {
    let service: MapService;
    const dummyBoard: Board = {
        _id: 'dummyId',
        name: 'Dummy Board',
        description: 'Dummy description',
        size: 2,
        board: [],
        isCTF: false,
        visibility: Visibility.PUBLIC,
        image: 'dummyImage',
        lastUpdatedAt: new Date(),
    };

    beforeEach(() => {
        spyOn(localStorage, 'getItem').and.callFake((key: string) => {
            if (key === 'firstBoardValue') {
                return JSON.stringify(dummyBoard);
            }
            return null;
        });
        spyOn(localStorage, 'setItem');
        TestBed.configureTestingModule({
            providers: [MapService],
        });
        service = TestBed.inject(MapService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize board data and generate board if empty', () => {
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
            lastUpdatedAt: new Date(),
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

    it('setBoardDescription should update the board description', () => {
        const newDesc = 'New Description';
        service.setBoardDescription(newDesc);
        expect(service.getBoardToSave().value.description).toEqual(newDesc);
    });

    it('setCellTile should update the tile of a specific cell', () => {
        service.setCellTile(1, 1, Tile.CLOSED_DOOR);
        const updatedTile = service.getBoardToSave().value.board[1][1].tile;
        expect(updatedTile).toEqual(Tile.CLOSED_DOOR);
    });

    it('setCellItem should update the item of a specific cell', () => {
        service.setCellItem(1, 1, Item.FLAG);
        const updatedItem = service.getBoardToSave().value.board[1][1].item;
        expect(updatedItem).toEqual(Item.FLAG);
    });
});
