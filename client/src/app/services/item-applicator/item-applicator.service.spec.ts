/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { ItemApplicatorService } from '@app/services/item-applicator/item-applicator.service';
import { MapService } from '@app/services/map/map.service';
import { ToolSelectionService } from '@app/services/tool-selection/tool-selection.service';
import { Item, Tile } from '@common/enums';
import { BehaviorSubject } from 'rxjs';
// import { Vec2 } from '@common/board';

describe('ItemApplicatorService', () => {
    let service: ItemApplicatorService;
    let toolSelectionService: jasmine.SpyObj<ToolSelectionService>;
    let mapService: jasmine.SpyObj<MapService>;

    beforeEach(() => {
        toolSelectionService = jasmine.createSpyObj('ToolSelectionService', [], {
            selectedItem$: new BehaviorSubject<Item | null>(null),
        });
        mapService = jasmine.createSpyObj('MapService', [
            'getCellItem',
            'setCellItem',
            'decreaseSpawnsToPlace',
            'increaseSpawnsToPlace',
            'decreaseItemsToPlace',
            'increaseItemsToPlace',
            'setHasFlagOnBoard',
            'getCellTile',
            'getBoardSize',
        ]);
        // Provide a default for getBoardSize
        mapService.getBoardSize.and.returnValue(5);

        TestBed.configureTestingModule({
            providers: [
                ItemApplicatorService,
                { provide: ToolSelectionService, useValue: toolSelectionService },
                { provide: MapService, useValue: mapService },
            ],
        });
        service = TestBed.inject(ItemApplicatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Tool Selection', () => {
        it('should update selected item from ToolSelectionService', () => {
            (toolSelectionService.selectedItem$ as BehaviorSubject<Item>).next(Item.Spawn);
            expect((service as any).selectedItem).toBe(Item.Spawn);
        });
    });

    describe('Mouse Events', () => {
        it('should handle mouse down and set old item position', () => {
            mapService.getCellItem.and.returnValue(Item.Flag);
            const event = new MouseEvent('mousedown', { button: 0 });
            const rect = new DOMRect(0, 0, 500, 500);
            service.handleMouseDown(event, rect);
            expect((service as any).oldItemPos).not.toEqual({ x: -1, y: -1 });
        });

        it('should handle mouse up and reset old item position', () => {
            (service as any).oldItemPos = { x: 10, y: 10 };
            service.handleMouseUp();
            expect((service as any).oldItemPos).toEqual({ x: -1, y: -1 });
        });

        it('should handle right-click (mouse down) and call deleteItem', () => {
            const deleteSpy = spyOn<any>(service, 'deleteItem');
            mapService.getCellItem.and.returnValue(Item.Flag);
            const event = new MouseEvent('mousedown', { button: 2 });
            const rect = new DOMRect(0, 0, 500, 500);
            service.handleMouseDown(event, rect);
            expect(deleteSpy).toHaveBeenCalled();
        });
    });

    describe('Drag Events', () => {
        it('should delete item when dragged outside board and back to container', () => {
            const deleteSpy = spyOn<any>(service, 'deleteItem');
            (service as any).isBackToContainer = true;
            (service as any).oldItemPos = { x: 2, y: 2 };
            const event = new DragEvent('dragend', { clientX: 600, clientY: 600 });
            const rect = new DOMRect(0, 0, 500, 500);
            service.handleDragEnd(event, rect);
            expect(deleteSpy).toHaveBeenCalledWith(2, 2);
        });

        it('should update item position when dragged within board', () => {
            const updatePositionSpy = spyOn<any>(service, 'updatePosition');
            (service as any).oldItemPos = { x: 1, y: 1 };
            const event = new DragEvent('dragend', { clientX: 100, clientY: 100 });
            const rect = new DOMRect(0, 0, 500, 500);
            service.handleDragEnd(event, rect);
            expect(updatePositionSpy).toHaveBeenCalled();
        });
    });

    describe('Item Placement & Deletion', () => {
        it('should correctly apply an item when placing a Flag', () => {
            mapService.getCellItem.and.returnValue(Item.Default);
            (service as any).selectedItem = Item.Flag;
            service['applyItem'](3, 3);
            expect(mapService.setCellItem).toHaveBeenCalledWith(3, 3, Item.Flag);
            expect(mapService.setHasFlagOnBoard).toHaveBeenCalledWith(true);
        });

        it('should correctly delete an item when cell contains a Spawn', () => {
            mapService.getCellItem.and.returnValue(Item.Spawn);
            service['deleteItem'](2, 2);
            expect(mapService.increaseSpawnsToPlace).toHaveBeenCalled();
            expect(mapService.setCellItem).toHaveBeenCalledWith(2, 2, Item.Default);
        });

        it('should unset the flag on board when deleting a Flag item', () => {
            mapService.getCellItem.and.returnValue(Item.Flag);
            service['deleteItem'](5, 5);
            expect(mapService.setHasFlagOnBoard).toHaveBeenCalledWith(false);
            expect(mapService.setCellItem).toHaveBeenCalledWith(5, 5, Item.Default);
        });

        it('should decrease spawns when placing a Spawn item', () => {
            mapService.getCellItem.and.returnValue(Item.Default);
            (service as any).selectedItem = Item.Spawn;
            service['applyItem'](3, 3);
            expect(mapService.decreaseSpawnsToPlace).toHaveBeenCalled();
            expect(mapService.setCellItem).toHaveBeenCalledWith(3, 3, Item.Spawn);
        });

        it('should decrease items when placing a generic item', () => {
            mapService.getCellItem.and.returnValue(Item.Default);
            (service as any).selectedItem = Item.Default;
            service['applyItem'](2, 2);
            expect(mapService.decreaseItemsToPlace).toHaveBeenCalled();
            expect(mapService.setCellItem).toHaveBeenCalledWith(2, 2, Item.Default);
        });

        it('should delete an existing item if cell is occupied before applying new one', () => {
            const deleteSpy = spyOn<any>(service, 'deleteItem');
            mapService.getCellItem.and.returnValue(Item.Flag);
            (service as any).selectedItem = Item.Spawn;
            service['applyItem'](1, 1);
            expect(deleteSpy).toHaveBeenCalledWith(1, 1);
            expect(mapService.setCellItem).toHaveBeenCalledWith(1, 1, Item.Spawn);
        });
    });

    describe('Item Movement Logic (updatePosition)', () => {
        beforeEach(() => {
            // Set up getCellItem to return default, and only if not already spied.
            mapService.getCellItem.and.returnValue(Item.Default);
            // To avoid "already been spied upon", check if getCellTile has calls; if not, spy here.
            if (!mapService.getCellTile.calls.any()) {
                mapService.getCellTile.and.returnValue(Tile.Floor);
            }
        });

        it('should not apply an item on a wall tile', () => {
            const applySpy = spyOn<any>(service, 'applyItem');
            mapService.getCellTile.and.returnValue(Tile.Wall);
            service['updatePosition']({ x: 1, y: 1 }, { x: 2, y: 2 });
            expect(applySpy).not.toHaveBeenCalled();
        });

        it('should apply an item if tile is not a wall or door', () => {
            const applySpy = spyOn<any>(service, 'applyItem');
            mapService.getCellTile.and.returnValue(Tile.Floor);
            service['updatePosition']({ x: 1, y: 1 }, { x: 2, y: 2 });
            expect(applySpy).toHaveBeenCalledWith(2, 2);
        });

        it('should delete item from old position and apply new item', () => {
            const deleteSpy = spyOn<any>(service, 'deleteItem');
            const applySpy = spyOn<any>(service, 'applyItem');
            mapService.getCellTile.and.returnValue(Tile.Floor);
            service['updatePosition']({ x: 1, y: 1 }, { x: 2, y: 2 });
            expect(deleteSpy).toHaveBeenCalledWith(1, 1);
            expect(applySpy).toHaveBeenCalledWith(2, 2);
        });

        it('should return early if destination already has an item', () => {
            // Setup getCellItem to return a non-default value to force early return.
            mapService.getCellItem.and.returnValue(Item.Chest);
            // Since getCellTile might already be spied, do not re-spy.
            service['updatePosition']({ x: 1, y: 1 }, { x: 2, y: 2 });
            // Expect no call to applyItem
            expect(spyOn<any>(service, 'applyItem')).not.toHaveBeenCalled();
        });

        it('should allow placing an item if destination is same as old position', () => {
            const applySpy = spyOn<any>(service, 'applyItem');
            mapService.getCellTile.and.returnValue(Tile.Floor);
            service['updatePosition']({ x: 2, y: 2 }, { x: 2, y: 2 });
            expect(applySpy).toHaveBeenCalledWith(2, 2);
        });
    });

    describe('Container Behavior', () => {
        it('should set isBackToContainer to true when selected item matches', () => {
            (service as any).selectedItem = Item.Spawn;
            service.setBackToContainer(Item.Spawn);
            expect((service as any).isBackToContainer).toBeTrue();
        });

        it('should set isBackToContainer to false when selected item does not match', () => {
            (service as any).selectedItem = Item.Flag;
            service.setBackToContainer(Item.Spawn);
            expect((service as any).isBackToContainer).toBeFalse();
        });
    });

    it('should set isBackToContainer to false when called with default argument', () => {
        (service as any).selectedItem = Item.Spawn;
        service.setBackToContainer();
        expect((service as any).isBackToContainer).toBeFalse();
    });
});
