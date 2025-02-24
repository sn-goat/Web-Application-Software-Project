import { TestBed } from '@angular/core/testing';
import { ItemApplicatorService } from '@app/services/code/item-applicator.service';
import { MapService } from '@app/services/code/map.service';
import { ToolSelectionService } from '@app/services/code/tool-selection.service';
import { Item, Tile } from '@common/enums';
import { BehaviorSubject } from 'rxjs';

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
            'getBoardSize'
        ]);

        TestBed.configureTestingModule({
            providers: [
                ItemApplicatorService,
                { provide: ToolSelectionService, useValue: toolSelectionService },
                { provide: MapService, useValue: mapService }
            ]
        });

        service = TestBed.inject(ItemApplicatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Tool Selection', () => {
        it('should update selected item from ToolSelectionService', () => {
            (toolSelectionService.selectedItem$ as BehaviorSubject<Item>).next(Item.SPAWN);
            expect(service['selectedItem']).toBe(Item.SPAWN);
        });
    });

    describe('Mouse Events', () => {
        it('should handle mouse down and set old item position', () => {
            mapService.getCellItem.and.returnValue(Item.FLAG);
            const event = new MouseEvent('mousedown', { button: 0 });
            const rect = new DOMRect(0, 0, 500, 500);

            service.handleMouseDown(event, rect);
            expect(service['oldItemPos']).not.toEqual({ x: -1, y: -1 });
        });

        it('should handle mouse up and reset old item position', () => {
            service.handleMouseUp();
            expect(service['oldItemPos']).toEqual({ x: -1, y: -1 });
        });

        it('should handle right-click (mouse down) for item deletion', () => {
            spyOn(service as any, 'deleteItem');
            mapService.getCellItem.and.returnValue(Item.FLAG);

            const event = new MouseEvent('mousedown', { button: 2 });
            const rect = new DOMRect(0, 0, 500, 500);

            service.handleMouseDown(event, rect);
            expect(service['deleteItem']).toHaveBeenCalled();
        });
    });

    describe('Drag Events', () => {
        it('should delete item when dragged outside board and back to container', () => {
            spyOn(service as any, 'deleteItem');
            service['isBackToContainer'] = true;
            service['oldItemPos'] = { x: 2, y: 2 };

            const event = new DragEvent('dragend', { clientX: 600, clientY: 600 });
            const rect = new DOMRect(0, 0, 500, 500);

            service.handleDragEnd(event, rect);
            expect(service['deleteItem']).toHaveBeenCalledWith(2, 2);
        });

        it('should update item position when dragged within board', () => {
            spyOn(service as any, 'updatePosition');
            service['oldItemPos'] = { x: 1, y: 1 };

            const event = new DragEvent('dragend', { clientX: 100, clientY: 100 });
            const rect = new DOMRect(0, 0, 500, 500);

            service.handleDragEnd(event, rect);
            expect(service['updatePosition']).toHaveBeenCalled();
        });
    });

    describe('Item Placement & Deletion', () => {
        it('should correctly apply an item', () => {
            mapService.getCellItem.and.returnValue(Item.DEFAULT);
            service['selectedItem'] = Item.FLAG;

            service['applyItem'](3, 3);
            expect(mapService.setCellItem).toHaveBeenCalledWith(3, 3, Item.FLAG);
            expect(mapService.setHasFlagOnBoard).toHaveBeenCalledWith(true);
        });

        it('should correctly delete an item', () => {
            mapService.getCellItem.and.returnValue(Item.SPAWN);

            service['deleteItem'](2, 2);
            expect(mapService.increaseSpawnsToPlace).toHaveBeenCalled();
            expect(mapService.setCellItem).toHaveBeenCalledWith(2, 2, Item.DEFAULT);
        });

        it('should unset the flag on the board when deleting a FLAG item', () => {
            mapService.getCellItem.and.returnValue(Item.FLAG);

            service['deleteItem'](5, 5);

            expect(mapService.setHasFlagOnBoard).toHaveBeenCalledWith(false);
            expect(mapService.setCellItem).toHaveBeenCalledWith(5, 5, Item.DEFAULT);
        });

        it('should decrease spawns when placing a SPAWN item', () => {
            mapService.getCellItem.and.returnValue(Item.DEFAULT);
            service['selectedItem'] = Item.SPAWN;

            service['applyItem'](3, 3);

            expect(mapService.decreaseSpawnsToPlace).toHaveBeenCalled();
            expect(mapService.setCellItem).toHaveBeenCalledWith(3, 3, Item.SPAWN);
        });

        it('should decrease items to place when placing a generic item', () => {
            mapService.getCellItem.and.returnValue(Item.DEFAULT);
            service['selectedItem'] = Item.DEFAULT;

            service['applyItem'](2, 2);

            expect(mapService.decreaseItemsToPlace).toHaveBeenCalled();
            expect(mapService.setCellItem).toHaveBeenCalledWith(2, 2, Item.DEFAULT);
        });

        it('should delete the existing item if the cell is occupied', () => {
            spyOn(service as any, 'deleteItem');
            mapService.getCellItem.and.returnValue(Item.FLAG);
            service['selectedItem'] = Item.SPAWN;

            service['applyItem'](1, 1);

            expect(service['deleteItem']).toHaveBeenCalledWith(1, 1);
            expect(mapService.setCellItem).toHaveBeenCalledWith(1, 1, Item.SPAWN);
        });
    });

    describe('Item Movement Logic', () => {
        it('should not apply an item on a wall tile', () => {
            spyOn(service as any, 'applyItem');

            mapService.getCellTile.and.returnValue(Tile.WALL);
            service['updatePosition']({ x: 1, y: 1 }, { x: 2, y: 2 });

            expect(service['applyItem']).not.toHaveBeenCalled();
        });

        it('should apply an item if the tile is not a wall or door', () => {
            spyOn(service as any, 'applyItem');

            mapService.getCellTile.and.returnValue(Tile.FLOOR);
            service['updatePosition']({ x: 1, y: 1 }, { x: 2, y: 2 });

            expect(service['applyItem']).toHaveBeenCalledWith(2, 2);
        });

        it('should delete item when updating position', () => {
            spyOn(service as any, 'deleteItem');
            spyOn(service as any, 'applyItem');

            mapService.getCellTile.and.returnValue(Tile.FLOOR);
            service['updatePosition']({ x: 1, y: 1 }, { x: 2, y: 2 });

            expect(service['deleteItem']).toHaveBeenCalledWith(1, 1);
            expect(service['applyItem']).toHaveBeenCalledWith(2, 2);
        });
    });

    describe('Container Behavior', () => {
        it('should set isBackToContainer based on selectedItem', () => {
            service['selectedItem'] = Item.SPAWN;
            service.setBackToContainer(Item.SPAWN);
            expect(service['isBackToContainer']).toBeTrue();
        });

        it('should set isBackToContainer to false when item does not match selectedItem', () => {
            service['selectedItem'] = Item.FLAG;
            service.setBackToContainer(Item.SPAWN);
            expect(service['isBackToContainer']).toBeFalse();
        });
    });
    
    it('should set isBackToContainer to false when item does not match selectedItem', () => {
        service['selectedItem'] = Item.FLAG;
        service.setBackToContainer(Item.SPAWN);
        expect(service['isBackToContainer']).toBeFalse();
    });

    it('should set isBackToContainer to false when called with default item', () => {
        service['selectedItem'] = Item.SPAWN;
        service.setBackToContainer();
        expect(service['isBackToContainer']).toBeFalse();
    });
});
