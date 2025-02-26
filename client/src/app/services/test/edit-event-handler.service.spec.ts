/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { EditEventHandlerService } from '@app/services/code/edit-event-handler.service';
import { ItemApplicatorService } from '@app/services/code/item-applicator.service';
import { MapService } from '@app/services/code/map.service';
import { TileApplicatorService } from '@app/services/code/tile-applicator.service';
import { Item } from '@common/enums';

describe('EditEventHandlerService', () => {
    let service: EditEventHandlerService;
    let mapService: jasmine.SpyObj<MapService>;
    let itemApplicatorService: jasmine.SpyObj<ItemApplicatorService>;
    let tileApplicatorService: jasmine.SpyObj<TileApplicatorService>;

    beforeEach(() => {
        mapService = jasmine.createSpyObj('MapService', ['getCellItem', 'getBoardSize']);
        itemApplicatorService = jasmine.createSpyObj('ItemApplicatorService', ['handleMouseDown', 'handleMouseUp', 'handleDragEnd']);
        tileApplicatorService = jasmine.createSpyObj('TileApplicatorService', ['handleMouseDown', 'handleMouseUp', 'handleMouseMove']);

        TestBed.configureTestingModule({
            providers: [
                EditEventHandlerService,
                { provide: MapService, useValue: mapService },
                { provide: ItemApplicatorService, useValue: itemApplicatorService },
                { provide: TileApplicatorService, useValue: tileApplicatorService },
            ],
        });

        service = TestBed.inject(EditEventHandlerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('handleMouseDown', () => {
        it('should call itemApplicatorService when cell is not default', () => {
            mapService.getCellItem.and.returnValue(Item.FLAG);
            const event = new MouseEvent('mousedown');
            const rect = new DOMRect(0, 0, 500, 500);

            service.handleMouseDown(event, rect);

            expect(itemApplicatorService.handleMouseDown).toHaveBeenCalledWith(event, rect);
            expect(tileApplicatorService.handleMouseDown).not.toHaveBeenCalled();
        });

        it('should call tileApplicatorService when cell is default', () => {
            mapService.getCellItem.and.returnValue(Item.DEFAULT);
            const event = new MouseEvent('mousedown');
            const rect = new DOMRect(0, 0, 500, 500);

            service.handleMouseDown(event, rect);

            expect(tileApplicatorService.handleMouseDown).toHaveBeenCalledWith(event, rect);
            expect(itemApplicatorService.handleMouseDown).not.toHaveBeenCalled();
        });
    });

    describe('handleMouseUp', () => {
        it('should call handleMouseUp on both itemApplicatorService and tileApplicatorService', () => {
            const event = new MouseEvent('mouseup');

            service.handleMouseUp(event);

            expect(itemApplicatorService.handleMouseUp).toHaveBeenCalled();
            expect(tileApplicatorService.handleMouseUp).toHaveBeenCalledWith(event);
        });
    });

    describe('handleMouseMove', () => {
        it('should call tileApplicatorService.handleMouseMove', () => {
            const rect = new DOMRect(0, 0, 500, 500);
            const event = new MouseEvent('mousemove');

            service.handleMouseMove(event, rect);

            expect(tileApplicatorService.handleMouseMove).toHaveBeenCalledWith(rect);
        });
    });

    describe('handleDragEnd', () => {
        it('should call itemApplicatorService.handleDragEnd', () => {
            const event = new DragEvent('dragend');
            const rect = new DOMRect(0, 0, 500, 500);

            service.handleDragEnd(event, rect);

            expect(itemApplicatorService.handleDragEnd).toHaveBeenCalledWith(event, rect);
        });
    });

    describe('screenToBoard', () => {
        it('should correctly convert screen coordinates to board coordinates', () => {
            mapService.getBoardSize.and.returnValue(10);
            const rect = new DOMRect(0, 0, 500, 500);

            const result = (service as any).screenToBoard(250, 250, rect);

            expect(result).toEqual({ x: 5, y: 5 });
        });
    });
});
