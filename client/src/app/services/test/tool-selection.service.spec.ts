import { TestBed } from '@angular/core/testing';
import { Tile, Item, Size } from '@common/enums';
import { ToolSelectionService } from '@app/services/code/tool-selection.service';

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
});
