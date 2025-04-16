/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { BOARD_SIZE_MAPPING } from '@app/constants/map-size-limitd';
import { MapService } from '@app/services/map/map.service';
import { Board, Validation } from '@common/board';
import { Item, Size, Tile, Visibility } from '@common/enums';
import { Avatar } from '@common/game';
import { BehaviorSubject } from 'rxjs';

describe('MapService', () => {
    let service: MapService;
    const dummyBoard: Board = {
        _id: 'dummyId',
        name: 'Dummy Board',
        description: 'Dummy description',
        size: 10,
        board: [],
        isCTF: false,
        visibility: Visibility.Public,
        updatedAt: new Date(),
    };

    beforeEach(() => {
        spyOn(localStorage, 'getItem').and.callFake((key: string) => {
            return key === 'firstBoardValue' ? JSON.stringify(dummyBoard) : null;
        });
        spyOn(localStorage, 'setItem');

        TestBed.configureTestingModule({
            providers: [MapService],
        });
        service = TestBed.inject(MapService);
        service.setBoardToFirstValue();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should increase and decrease spawns to place', () => {
        const initial = service['nbrSpawnsToPlace'].value;
        service.increaseSpawnsToPlace();
        expect(service['nbrSpawnsToPlace'].value).toBe(initial + 1);
        service.decreaseSpawnsToPlace();
        expect(service['nbrSpawnsToPlace'].value).toBe(initial);
    });

    it('should increase and decrease items to place', () => {
        const initial = service['nbrItemsToPlace'].value;
        service.increaseItemsToPlace();
        expect(service['nbrItemsToPlace'].value).toBe(initial + 1);
        service.decreaseItemsToPlace();
        expect(service['nbrItemsToPlace'].value).toBe(initial);
    });

    it('should set hasFlagOnBoard correctly', () => {
        service.setHasFlagOnBoard(true);
        expect(service['hasFlagOnBoard'].value).toBeTrue();
        service.setHasFlagOnBoard(false);
        expect(service['hasFlagOnBoard'].value).toBeFalse();
    });

    describe('isReadyToSave', () => {
        it('should return an error message when spawns or items remain to be placed', () => {
            const validation: Validation = service.isReadyToSave();
            expect(validation.isValid).toBeFalse();
            expect(validation.error).toContain('Vous devez placer');
        });

        it('should return valid when no spawns, no items to place and flag is set for CTF', () => {
            service['nbrSpawnsToPlace'].next(0);
            service['nbrItemsToPlace'].next(0);
            let validation: Validation = service.isReadyToSave();
            expect(validation.isValid).toBeTrue();
            expect(validation.error).toBe('');

            service.getBoardToSave().value.isCTF = true;
            service.setHasFlagOnBoard(true);
            validation = service.isReadyToSave();
            expect(validation.isValid).toBeTrue();
            expect(validation.error).toBe('');
        });

        it('should return error for CTF mode when flag is not placed', () => {
            service.getBoardToSave().value.isCTF = true;
            service.setHasFlagOnBoard(false);
            service['nbrSpawnsToPlace'].next(0);
            service['nbrItemsToPlace'].next(0);
            const validation: Validation = service.isReadyToSave();
            expect(validation.isValid).toBeFalse();
            expect(validation.error).toContain('drapeau');
        });
    });

    it('setMapData should update firstBoardValue and localStorage', () => {
        const newBoard: Board = {
            _id: 'newId',
            name: 'New Board',
            description: 'New description',
            size: 4,
            board: [],
            isCTF: true,
            visibility: Visibility.Private,
            updatedAt: new Date(),
        };
        service.setMapData(newBoard);
        expect(localStorage.setItem).toHaveBeenCalledWith('firstBoardValue', JSON.stringify(newBoard));
        expect(service['firstBoardValue']).toEqual(newBoard);
    });

    it('getBoardToSave should return the BehaviorSubject for board', () => {
        const bs = service.getBoardToSave();
        expect(bs).toBeTruthy();
        expect(bs instanceof BehaviorSubject).toBeTrue();
    });

    it('setBoardName should update board name', () => {
        const newName = 'Updated Board Name';
        service.setBoardName(newName);
        expect(service.getBoardToSave().value.name).toEqual(newName);
    });

    it('setBoardDescription should update board description', () => {
        const newDesc = 'Updated Board Description';
        service.setBoardDescription(newDesc);
        expect(service.getBoardToSave().value.description).toEqual(newDesc);
    });

    it('getBoardSize should return the board size', () => {
        expect(service.getBoardSize()).toBe(service.getBoardToSave().value.size);
    });

    it('getCellTile should return the correct tile at specified coordinates', () => {
        const cellTile = service.getCellTile(0, 0);
        expect(cellTile).toEqual(Tile.Floor);
    });

    it('getCellItem should return the correct item at specified coordinates', () => {
        const cellItem = service.getCellItem(0, 0);
        expect(cellItem).toEqual(Item.Default);
    });

    it('isModeCTF should return the isCTF flag from boardToSave', () => {
        const board = service.getBoardToSave().value;
        expect(service.isModeCTF()).toEqual(board.isCTF);
    });

    it('setCellTile should update the tile of the specified cell', () => {
        const board = service.getBoardToSave().value;
        board.board = Array(board.size)
            .fill(null)
            .map((_, rowIndex) =>
                Array(board.size)
                    .fill(null)
                    .map((__, colIndex) => ({
                        tile: Tile.Floor,
                        item: Item.Default,
                        position: { x: colIndex, y: rowIndex },
                        cost: 1,
                        player: Avatar.Default,
                    })),
            );
        service['boardToSave'].next(board);
        service.setCellTile(1, 1, Tile.Wall);
        expect(service.getBoardToSave().value.board[1][1].tile).toEqual(Tile.Wall);
    });

    it('setCellItem should update the item of the specified cell', () => {
        const board = service.getBoardToSave().value;
        board.board = Array(board.size)
            .fill(null)
            .map((_, rowIndex) =>
                Array(board.size)
                    .fill(null)
                    .map((__, colIndex) => ({
                        tile: Tile.Floor,
                        item: Item.Default,
                        position: { x: colIndex, y: rowIndex },
                        cost: 1,
                        player: Avatar.Default,
                    })),
            );
        service['boardToSave'].next(board);
        service.setCellItem(2, 0, Item.Flag);
        expect(service.getBoardToSave().value.board[0][2].item).toEqual(Item.Flag);
    });

    describe('setBoardToFirstValue', () => {
        it('should make a deep copy of firstBoardValue when setting boardToSave', () => {
            const originalBoard: Board = {
                _id: 'original',
                name: 'Original Board',
                description: 'Original description',
                size: 5,
                board: [[{ tile: Tile.Floor, item: Item.Default, position: { x: 0, y: 0 }, cost: 1, player: Avatar.Default }]],
                isCTF: false,
                visibility: Visibility.Public,
                updatedAt: new Date(),
            };

            service['firstBoardValue'] = originalBoard;

            service.setBoardToFirstValue();

            const savedBoard = service.getBoardToSave().value;

            service['firstBoardValue'].name = 'Modified Original';

            expect(savedBoard.name).not.toEqual('Modified Original');
            expect(savedBoard.name).toEqual('Original Board');
        });

        it('should call generateBoard when firstBoardValue has no board array', () => {
            const emptyBoard: Board = {
                _id: 'empty',
                name: 'Empty Board',
                description: 'No board array',
                size: 5,
                board: [],
                isCTF: false,
                visibility: Visibility.Public,
                updatedAt: new Date(),
            };

            service['firstBoardValue'] = emptyBoard;

            const generateSpy = spyOn<any>(service, 'generateBoard').and.callThrough();

            service.setBoardToFirstValue();

            expect(generateSpy).toHaveBeenCalled();
        });

        it('should parse items in the board correctly', () => {
            const boardSize = 10;

            const boardWithItems: Board = {
                _id: 'items',
                name: 'Board with Items',
                description: 'Has items',
                size: boardSize,
                board: [
                    [
                        { tile: Tile.Floor, item: Item.Spawn, position: { x: 0, y: 0 }, cost: 1, player: Avatar.Default },
                        { tile: Tile.Floor, item: Item.Flag, position: { x: 1, y: 0 }, cost: 1, player: Avatar.Default },
                    ],
                    [
                        { tile: Tile.Wall, item: Item.Bow, position: { x: 0, y: 1 }, cost: 1, player: Avatar.Default },
                        { tile: Tile.Floor, item: Item.Default, position: { x: 1, y: 1 }, cost: 1, player: Avatar.Default },
                    ],
                ],
                isCTF: true,
                visibility: Visibility.Public,
                updatedAt: new Date(),
            };

            service['firstBoardValue'] = boardWithItems;

            const decreaseSpawnsSpy = spyOn(service, 'decreaseSpawnsToPlace').and.callThrough();
            const decreaseItemsSpy = spyOn(service, 'decreaseItemsToPlace').and.callThrough();
            const setFlagSpy = spyOn(service, 'setHasFlagOnBoard').and.callThrough();

            const maxItems = BOARD_SIZE_MAPPING[boardSize as Size];
            service['nbrSpawnsToPlace'].next(maxItems);
            service['nbrItemsToPlace'].next(maxItems);
            service['hasFlagOnBoard'].next(false);

            service.setBoardToFirstValue();

            expect(decreaseSpawnsSpy).toHaveBeenCalledTimes(1);
            expect(decreaseItemsSpy).toHaveBeenCalledTimes(1);
            expect(setFlagSpy).toHaveBeenCalledWith(true);
            expect(service['nbrSpawnsToPlace'].value).toBe(maxItems - 1);
            expect(service['nbrItemsToPlace'].value).toBe(maxItems - 1);
            expect(service['hasFlagOnBoard'].value).toBeTrue();
        });
    });
});
