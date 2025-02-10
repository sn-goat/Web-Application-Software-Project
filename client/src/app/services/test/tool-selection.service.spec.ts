/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { ToolSelectionService } from '@app/services/code/tool-selection.service';
import { Board } from '@common/board';
import { Item, Size, Tile, Visibility } from '@common/enums';

describe('ToolSelectionService', () => {
    let service: ToolSelectionService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ToolSelectionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should update the selected tile', () => {
        const testTile = Tile.WATER;
        service.updateSelectedTile(testTile);

        expect(service.getSelectedTile()).toBe(testTile);
    });

    it('should not update the selcted tile if it is the same', () => {
        const testTile = Tile.CLOSED_DOOR;
        service.updateSelectedTile(testTile);
        service.updateSelectedTile(testTile);

        expect(service.getSelectedTile()).toBeNull();
    });

    it('should update the selected item', () => {
        const testItem = Item.CHEST;
        service.updateSelectedItem(testItem);

        expect(service.getSelectedItem()).toBe(testItem);
    });

    it('should set the max object by type', () => {
        const testMaxObjectByType = 5;
        service.setMaxObjectByType(testMaxObjectByType);

        expect(service.getMaxObjectByType()).toBe(testMaxObjectByType);
    });

    it('should set the board size', () => {
        const testBoardSize = Size.LARGE;
        service.setBoardSize(testBoardSize);

        expect(service.getBoardSize()).toBe(testBoardSize);
    });

    it('should confirm when there is enough object placed', () => {
        const testBoardSize = Size.SMALL;
        service.setBoardSize(testBoardSize);

        service.addItem(Item.PEARL);
        service.incrementChest();
        service.incrementSpawn();
        expect(service.isMinimumObjectPlaced()).toBeTrue();
        expect(service.getItemCounter()).toBe(2);

        service.removeItem(Item.PEARL);
        service.decrementChest();
        service.decrementSpawn();
        expect(service.isMinimumObjectPlaced()).toBeFalse();
        expect(service.getItemCounter()).toBe(0);
    });

    it('should do nothing when trying to delete an nonexisting item', () => {
        service.removeItem(Item.PEARL);
        expect(service.getItemCounter()).toBe(0);
    });

    it('should set the spawn placement', () => {
        service.setIsSpawnPlaced(true);
        expect(service.getIsSpawnPlaced()).toBeTrue();
    });

    describe('parseBoard', () => {
        const mockBoard = {
            _id: '123',
            name: 'Test Board',
            size: 10,
            isCTF: true,
            description: 'Test Description',
            visibility: Visibility.PUBLIC,
            image: 'image.jpg',
            lastUpdatedAt: new Date(),
        } as Board;
        it('should parse the board and update the item counter', () => {
            mockBoard.board = [
                [
                    { tile: Tile.FLOOR, item: Item.PEARL, position: { x: 0, y: 0 } },
                    { tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 1, y: 0 } },
                ],
            ];
            service.parseBoard(mockBoard);

            expect(service.getItemCounter()).toBe(3);
        });

        it('should parse the board and update the spawn counter', () => {
            mockBoard.board = [
                [
                    { tile: Tile.FLOOR, item: Item.SPAWN, position: { x: 0, y: 0 } },
                    { tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 1, y: 0 } },
                ],
            ];
            service.parseBoard(mockBoard);

            expect(service.getIsSpawnPlaced()).toBeTrue();
        });

        it('should parse the board and update the chest counter', () => {
            mockBoard.board = [
                [
                    { tile: Tile.FLOOR, item: Item.CHEST, position: { x: 0, y: 0 } },
                    { tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: 1, y: 0 } },
                ],
            ];
            service.parseBoard(mockBoard);

            expect(service.getItemCounter()).toBe(4);
        });
    });
});
