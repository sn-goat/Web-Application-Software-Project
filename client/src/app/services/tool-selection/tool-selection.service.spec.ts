import { TestBed } from '@angular/core/testing';
import { ToolSelectionService } from '@app/services/tool-selection/tool-selection.service';
import { Item, Tile } from '@common/enums';

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

    it('should toggle the selected tile off if the same tile is selected again', () => {
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

    it('should clear the selected item when updated with null', () => {
        service.updateSelectedItem(Item.CHEST);
        service.updateSelectedItem(Item.DEFAULT);
        expect(service.getSelectedItem()).toBe(Item.DEFAULT);
    });
});
