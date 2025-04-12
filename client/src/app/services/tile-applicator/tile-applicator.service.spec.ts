/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { MapService } from '@app/services/map/map.service';
import { MouseEditorService } from '@app/services/mouse-editor/mouse-editor.service';
import { TileApplicatorService } from '@app/services/tile-applicator/tile-applicator.service';
import { ToolSelectionService } from '@app/services/tool-selection/tool-selection.service';

import { Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';

const boardSize = 10;
const dummyRect: DOMRect = new DOMRect(0, 0, 100, 100);
const rect: DOMRect = new DOMRect(0, 0, 200, 200);

describe('TileApplicatorService', () => {
    let service: TileApplicatorService;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let mouseEditorServiceSpy: jasmine.SpyObj<MouseEditorService>;
    let toolSelectionServiceSpy: jasmine.SpyObj<ToolSelectionService>;

    let currentCoordSubject: BehaviorSubject<Vec2>;
    let selectedTileSubject: BehaviorSubject<Tile | null>;

    beforeEach(() => {
        currentCoordSubject = new BehaviorSubject<Vec2>({ x: 0, y: 0 });
        selectedTileSubject = new BehaviorSubject<Tile | null>(Tile.Wall);

        mouseEditorServiceSpy = jasmine.createSpyObj('MouseEditorService', [], {
            currentCoord$: currentCoordSubject.asObservable(),
        });
        toolSelectionServiceSpy = jasmine.createSpyObj('ToolSelectionService', [], {
            selectedTile$: selectedTileSubject.asObservable(),
        });
        mapServiceSpy = jasmine.createSpyObj('MapService', ['getCellItem', 'getCellTile', 'setCellTile', 'setCellItem', 'getBoardSize']);
        mapServiceSpy.getBoardSize.and.returnValue(boardSize);

        TestBed.configureTestingModule({
            providers: [
                TileApplicatorService,
                { provide: MouseEditorService, useValue: mouseEditorServiceSpy },
                { provide: ToolSelectionService, useValue: toolSelectionServiceSpy },
                { provide: MapService, useValue: mapServiceSpy },
            ],
        });
        service = TestBed.inject(TileApplicatorService);

        selectedTileSubject.next(Tile.Wall);
        currentCoordSubject.next({ x: 0, y: 0 });
    });

    function createFakeMouseEvent(button: number, pageX: number, pageY: number): MouseEvent {
        return { button, pageX, pageY } as MouseEvent;
    }

    describe('handleMouseDown', () => {
        it('should handle left-click (button 0) and apply tile when cell item is Default', () => {
            const event = createFakeMouseEvent(0, 15, 25);
            const updateTileSpy = spyOn<any>(service, 'updateTile').and.callThrough();

            mapServiceSpy.getCellItem.and.returnValue(Item.Default);

            service.handleMouseDown(event, dummyRect);

            expect((service as any).previousCoord).toEqual({ x: 15, y: 25 });
            expect((service as any).isTilesBeingApplied).toBeTrue();
            expect(updateTileSpy).toHaveBeenCalledWith(1, 2);
        });

        it('should handle right-click (button 2) and delete tile when cell item is Default', () => {
            const event = createFakeMouseEvent(2, 35, 45);
            const updateTileSpy = spyOn<any>(service, 'updateTile').and.callThrough();

            mapServiceSpy.getCellItem.and.returnValue(Item.Default);

            service.handleMouseDown(event, dummyRect);

            expect((service as any).previousCoord).toEqual({ x: 35, y: 45 });
            expect((service as any).isTilesBeingDeleted).toBeTrue();
            expect(updateTileSpy).toHaveBeenCalledWith(3, 4);
        });

        it('should not update tile if cell item is not Default', () => {
            mapServiceSpy.getCellItem.and.returnValue(Item.Flag);
            const event = createFakeMouseEvent(0, 50, 50);
            const updateTileSpy = spyOn<any>(service, 'updateTile').and.callThrough();

            service.handleMouseDown(event, dummyRect);

            expect((service as any).previousCoord).toEqual({ x: 50, y: 50 });
            expect((service as any).isTilesBeingApplied).toBeFalse();
            expect((service as any).isTilesBeingDeleted).toBeFalse();
            expect(updateTileSpy).not.toHaveBeenCalled();
        });
    });

    describe('processLine final coordinate branch', () => {
        it('should call updateTile for the final coordinate when starting point is off-board', () => {
            (service as any).previousCoord = { x: -10, y: -10 };
            (service as any).currentCoord = { x: 10, y: 10 };
            (service as any).isTilesBeingApplied = true;
            const updateTileSpy = spyOn<any>(service, 'updateTile').and.callThrough();

            service.handleMouseMove(dummyRect);

            expect(updateTileSpy).toHaveBeenCalledWith(1, 1);
            expect((service as any).isTilesBeingApplied).toBeFalse();
            expect((service as any).isTilesBeingDeleted).toBeFalse();
        });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('handleMouseUp', () => {
        it('should reset left click flag for left button', () => {
            (service as any).isTilesBeingApplied = true;

            service.handleMouseUp(new MouseEvent('mouseup', { button: 0 }));

            expect((service as any).isTilesBeingApplied).toBeFalse();
            expect((service as any).previousCoord).toEqual({ x: -1, y: -1 });
        });

        it('should reset right click flag for right button', () => {
            (service as any).isTilesBeingDeleted = true;

            service.handleMouseUp(new MouseEvent('mouseup', { button: 2 }));

            expect((service as any).isTilesBeingDeleted).toBeFalse();
            expect((service as any).previousCoord).toEqual({ x: -1, y: -1 });
        });
    });

    describe('handleMouseMove', () => {
        it('should update intermediate tiles and previousCoord when tiles are being applied', () => {
            (service as any).isTilesBeingApplied = true;
            (service as any).previousCoord = { x: 30, y: 30 };
            currentCoordSubject.next({ x: 40, y: 40 });

            const processLineSpy = spyOn<any>(service, 'processLine');

            service.handleMouseMove(rect);

            expect(processLineSpy).toHaveBeenCalledWith({ x: 30, y: 30 }, rect);
            expect((service as any).previousCoord).toEqual({ x: 40, y: 40 });
        });

        it('should update intermediate tiles and previousCoord when tiles are being deleted', () => {
            (service as any).isTilesBeingDeleted = true;
            (service as any).previousCoord = { x: 50, y: 50 };
            currentCoordSubject.next({ x: 60, y: 60 });

            const processLineSpy = spyOn<any>(service, 'processLine');

            service.handleMouseMove(rect);

            expect(processLineSpy).toHaveBeenCalledWith({ x: 50, y: 50 }, rect);
            expect((service as any).previousCoord).toEqual({ x: 60, y: 60 });
        });

        it('should not update intermediate tiles when neither applying nor deleting', () => {
            (service as any).isTilesBeingApplied = false;
            (service as any).isTilesBeingDeleted = false;

            const processLineSpy = spyOn<any>(service, 'processLine');

            service.handleMouseMove(rect);

            expect(processLineSpy).not.toHaveBeenCalled();
        });
    });

    describe('processLine', () => {
        beforeEach(() => {
            spyOn<any>(service, 'isOnBoard').and.callFake((x: number, y: number, r: DOMRect) => {
                return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
            });

            spyOn<any>(service, 'screenToBoard').and.callFake((x: number, y: number, r: DOMRect) => {
                const cellWidth = r.width / boardSize;
                const cellHeight = r.height / boardSize;
                const tileX = Math.floor((x - r.left) / cellWidth);
                const tileY = Math.floor((y - r.top) / cellHeight);
                return { x: tileX, y: tileY };
            });
        });

        it('should update tiles along a horizontal line (right direction)', () => {
            (service as any).currentCoord = { x: 50, y: 10 };
            const previousCoord = { x: 10, y: 10 };

            const updateTileSpy = spyOn<any>(service, 'updateTile');

            (service as any).processLine(previousCoord, rect);

            expect(updateTileSpy).toHaveBeenCalled();
            expect(updateTileSpy.calls.count()).toBeGreaterThan(0);
        });

        it('should update tiles along a horizontal line (left direction)', () => {
            (service as any).currentCoord = { x: 10, y: 10 };
            const previousCoord = { x: 50, y: 10 };

            const updateTileSpy = spyOn<any>(service, 'updateTile');

            (service as any).processLine(previousCoord, rect);

            expect(updateTileSpy).toHaveBeenCalled();
            expect(updateTileSpy.calls.count()).toBeGreaterThan(0);
        });

        it('should update tiles along a vertical line', () => {
            (service as any).currentCoord = { x: 10, y: 50 };
            const previousCoord = { x: 10, y: 10 };

            const updateTileSpy = spyOn<any>(service, 'updateTile');

            (service as any).processLine(previousCoord, rect);

            expect(updateTileSpy).toHaveBeenCalled();
            expect(updateTileSpy.calls.count()).toBeGreaterThan(0);
        });

        it('should update tiles along a diagonal line', () => {
            (service as any).currentCoord = { x: 50, y: 50 };
            const previousCoord = { x: 10, y: 10 };

            const updateTileSpy = spyOn<any>(service, 'updateTile');

            (service as any).processLine(previousCoord, rect);

            expect(updateTileSpy).toHaveBeenCalled();
            expect(updateTileSpy.calls.count()).toBeGreaterThan(0);
        });

        it('should reset flags if a coordinate is off board', () => {
            (service as any).currentCoord = { x: 250, y: 10 };
            const previousCoord = { x: 10, y: 10 };
            (service as any).isTilesBeingApplied = true;
            (service as any).isTilesBeingDeleted = true;

            const isOnBoardSpy = service['isOnBoard'] as jasmine.Spy;
            isOnBoardSpy.and.callFake((x: number, y: number) => x < 200 && y < 200);

            (service as any).processLine(previousCoord, rect);

            expect((service as any).isTilesBeingApplied).toBeFalse();
            expect((service as any).isTilesBeingDeleted).toBeFalse();
        });
    });

    describe('updateTile', () => {
        it('should call revertToFLOOR when tiles are being deleted', () => {
            (service as any).isTilesBeingDeleted = true;
            (service as any).isTilesBeingApplied = false;

            const revertToFLOORSpy = spyOn<any>(service, 'revertToFLOOR');
            const applyTileSpy = spyOn<any>(service, 'applyTile');

            (service as any).updateTile(1, 1);

            expect(revertToFLOORSpy).toHaveBeenCalledWith(1, 1);
            expect(applyTileSpy).not.toHaveBeenCalled();
        });

        it('should call applyTile when tiles are being applied', () => {
            (service as any).isTilesBeingDeleted = false;
            (service as any).isTilesBeingApplied = true;

            const revertToFLOORSpy = spyOn<any>(service, 'revertToFLOOR');
            const applyTileSpy = spyOn<any>(service, 'applyTile');

            (service as any).updateTile(2, 2);

            expect(applyTileSpy).toHaveBeenCalledWith(2, 2);
            expect(revertToFLOORSpy).not.toHaveBeenCalled();
        });

        it('should not call any method when neither applying nor deleting', () => {
            (service as any).isTilesBeingDeleted = false;
            (service as any).isTilesBeingApplied = false;

            const revertToFLOORSpy = spyOn<any>(service, 'revertToFLOOR');
            const applyTileSpy = spyOn<any>(service, 'applyTile');

            (service as any).updateTile(3, 3);

            expect(revertToFLOORSpy).not.toHaveBeenCalled();
            expect(applyTileSpy).not.toHaveBeenCalled();
        });
    });

    describe('applyTile', () => {
        it('should do nothing if selectedTile is null', () => {
            (service as any).selectedTile = null;

            const applyWallSpy = spyOn<any>(service, 'applyWall');
            const applyDoorSpy = spyOn<any>(service, 'applyDoor');

            (service as any).applyTile(1, 1);

            expect(mapServiceSpy.setCellTile).not.toHaveBeenCalled();
            expect(applyWallSpy).not.toHaveBeenCalled();
            expect(applyDoorSpy).not.toHaveBeenCalled();
        });

        it('should call applyWall if selectedTile is Wall', () => {
            (service as any).selectedTile = Tile.Wall;

            const applyWallSpy = spyOn<any>(service, 'applyWall');

            (service as any).applyTile(2, 2);

            expect(applyWallSpy).toHaveBeenCalledWith(2, 2);
            expect(mapServiceSpy.setCellTile).not.toHaveBeenCalled();
        });

        it('should call applyDoor if selectedTile is ClosedDoor', () => {
            (service as any).selectedTile = Tile.ClosedDoor;

            const applyDoorSpy = spyOn<any>(service, 'applyDoor');

            (service as any).applyTile(3, 3);

            expect(applyDoorSpy).toHaveBeenCalledWith(3, 3);
            expect(mapServiceSpy.setCellTile).not.toHaveBeenCalled();
        });

        it('should directly set the cell tile for any other tile value', () => {
            (service as any).selectedTile = Tile.Floor;

            (service as any).applyTile(4, 4);

            expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(4, 4, Tile.Floor);
        });
    });

    describe('revertToFLOOR', () => {
        it('should set cell tile to Floor if current tile is not Floor', () => {
            mapServiceSpy.getCellTile.and.returnValue(Tile.Wall);

            (service as any).revertToFLOOR(5, 5);

            expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(5, 5, Tile.Floor);
        });

        it('should not set cell tile if current tile is already Floor', () => {
            mapServiceSpy.getCellTile.and.returnValue(Tile.Floor);

            (service as any).revertToFLOOR(6, 6);

            expect(mapServiceSpy.setCellTile).not.toHaveBeenCalled();
        });
    });

    describe('applyDoor', () => {
        it('should clear the cell item if it is not Default', () => {
            mapServiceSpy.getCellItem.and.returnValue(Item.Spawn);

            (service as any).applyDoor(7, 7);

            expect(mapServiceSpy.setCellItem).toHaveBeenCalledWith(7, 7, Item.Default);
        });

        it('should not clear the cell item if it is Default', () => {
            mapServiceSpy.getCellItem.and.returnValue(Item.Default);

            (service as any).applyDoor(8, 8);

            expect(mapServiceSpy.setCellItem).not.toHaveBeenCalled();
        });

        it('should set tile to OpenedDoor if current tile is ClosedDoor', () => {
            mapServiceSpy.getCellTile.and.returnValue(Tile.ClosedDoor);

            (service as any).applyDoor(9, 9);

            expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(9, 9, Tile.OpenedDoor);
        });

        it('should set tile to ClosedDoor if current tile is not ClosedDoor', () => {
            mapServiceSpy.getCellTile.and.returnValue(Tile.Floor);

            (service as any).applyDoor(0, 0);

            expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(0, 0, Tile.ClosedDoor);
        });
    });

    describe('applyWall', () => {
        it('should clear the cell item if it is not Default', () => {
            mapServiceSpy.getCellItem.and.returnValue(Item.Chest);

            (service as any).applyWall(1, 2);

            expect(mapServiceSpy.setCellItem).toHaveBeenCalledWith(1, 2, Item.Default);
        });

        it('should not clear the cell item if it is Default', () => {
            mapServiceSpy.getCellItem.and.returnValue(Item.Default);

            (service as any).applyWall(2, 3);

            expect(mapServiceSpy.setCellItem).not.toHaveBeenCalled();
        });

        it('should set tile to Wall', () => {
            (service as any).applyWall(3, 4);

            expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(3, 4, Tile.Wall);
        });
    });

    describe('screenToBoard', () => {
        it('should convert screen coordinates to board coordinates', () => {
            const x = 50;
            const y = 60;
            const cellWidth = rect.width / boardSize;
            const cellHeight = rect.height / boardSize;

            const result = (service as any).screenToBoard(x, y, rect);

            expect(result).toEqual({ x: Math.floor(50 / cellWidth), y: Math.floor(60 / cellHeight) });
            expect(result).toEqual({ x: 2, y: 3 });
        });
    });

    describe('isOnBoard', () => {
        it('should return true for coordinates inside the board', () => {
            expect((service as any).isOnBoard(10, 10, rect)).toBeTrue();
            expect((service as any).isOnBoard(0, 0, rect)).toBeTrue();
            expect((service as any).isOnBoard(199, 199, rect)).toBeTrue();
        });

        it('should return false for coordinates outside the board', () => {
            expect((service as any).isOnBoard(-1, 10, rect)).toBeFalse();
            expect((service as any).isOnBoard(10, -1, rect)).toBeFalse();
            expect((service as any).isOnBoard(201, 10, rect)).toBeFalse();
            expect((service as any).isOnBoard(10, 201, rect)).toBeFalse();
        });
    });
});
