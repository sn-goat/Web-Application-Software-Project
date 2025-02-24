/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { MapService } from '@app/services/code/map.service';
import { MouseEditorService } from '@app/services/code/mouse-editor.service';
import { TileApplicatorService } from '@app/services/code/tile-applicator.service';
import { ToolSelectionService } from '@app/services/code/tool-selection.service';

import { Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';

const boardSize = 10;
// Rectangles utilisés dans certains tests (dimensions différentes pour simuler différents contextes)
const dummyRect: DOMRect = new DOMRect(0, 0, 100, 100);
const rect: DOMRect = new DOMRect(0, 0, 200, 200);

describe('TileApplicatorService', () => {
    let service: TileApplicatorService;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let mouseEditorServiceSpy: jasmine.SpyObj<MouseEditorService>;
    let toolSelectionServiceSpy: jasmine.SpyObj<ToolSelectionService>;

    // On utilise ici des BehaviorSubject pour que les Observables aient une valeur initiale
    let currentCoordSubject: BehaviorSubject<Vec2>;
    let selectedTileSubject: BehaviorSubject<Tile | null>;

    beforeEach(() => {
        currentCoordSubject = new BehaviorSubject<Vec2>({ x: 0, y: 0 });
        // Pour simuler le comportement initial (premier fichier émettait Tile.WALL)
        selectedTileSubject = new BehaviorSubject<Tile | null>(Tile.WALL);

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

        // Simuler l'émission initiale comme dans le premier fichier
        selectedTileSubject.next(Tile.WALL);
        currentCoordSubject.next({ x: 0, y: 0 });
    });

    // Fonction utilitaire pour créer un faux MouseEvent (utilisé dans le premier ensemble de tests)
    function createFakeMouseEvent(button: number, pageX: number, pageY: number): MouseEvent {
        return { button, pageX, pageY } as MouseEvent;
    }

    // ================== Tests issus du premier fichier ==================
    describe('handleMouseDown', () => {
        it('should handle left-click (button 0) and apply tile when cell item is DEFAULT', () => {
            // Pour un clic gauche aux coordonnées (15,25)
            const event = createFakeMouseEvent(0, 15, 25);
            // La méthode screenToBoard calcule :
            // cellWidth = 100/10 = 10, donc tileX = floor(15/10)=1 et tileY = floor(25/10)=2.
            const updateTileSpy = spyOn<unknown>(service, 'updateTile').and.callThrough();

            // On configure getCellItem pour retourner DEFAULT
            mapServiceSpy.getCellItem.and.returnValue(Item.DEFAULT);

            service.handleMouseDown(event, dummyRect);

            // Vérifie que previousCoord est mise à jour
            expect((service as unknown).previousCoord).toEqual({ x: 15, y: 25 });
            // Pour un clic gauche, le flag d'application doit être activé
            expect((service as unknown).isTilesBeingApplied).toBeTrue();
            // On vérifie que updateTile est appelée avec les coordonnées de la cellule calculée (1,2)
            expect(updateTileSpy).toHaveBeenCalledWith(1, 2);
        });

        it('should handle right-click (button 2) and delete tile when cell item is DEFAULT', () => {
            // Pour un clic droit aux coordonnées (35,45)
            const event = createFakeMouseEvent(2, 35, 45);
            const updateTileSpy = spyOn<unknown>(service, 'updateTile').and.callThrough();

            mapServiceSpy.getCellItem.and.returnValue(Item.DEFAULT);

            service.handleMouseDown(event, dummyRect);

            // screenToBoard(35,45,dummyRect) donne : { x: floor(35/10)=3, y: floor(45/10)=4 }
            expect((service as unknown).previousCoord).toEqual({ x: 35, y: 45 });
            // Pour un clic droit, le flag de suppression doit être activé
            expect((service as unknown).isTilesBeingDeleted).toBeTrue();
            expect(updateTileSpy).toHaveBeenCalledWith(3, 4);
        });

        it('should not update tile if cell item is not DEFAULT', () => {
            // Forcer getCellItem à retourner autre chose que DEFAULT
            mapServiceSpy.getCellItem.and.returnValue(Item.FLAG);
            const event = createFakeMouseEvent(0, 50, 50);
            const updateTileSpy = spyOn<unknown>(service, 'updateTile').and.callThrough();

            service.handleMouseDown(event, dummyRect);

            // previousCoord doit être mise à jour même si la cellule n'est pas vide
            expect((service as unknown).previousCoord).toEqual({ x: 50, y: 50 });
            // Aucun flag ne doit être activé
            expect((service as unknown).isTilesBeingApplied).toBeFalse();
            expect((service as unknown).isTilesBeingDeleted).toBeFalse();
            // updateTile ne doit pas être appelée
            expect(updateTileSpy).not.toHaveBeenCalled();
        });
    });

    describe('updateIntermediateTiles final coordinate branch', () => {
        it('should call updateTile for the final coordinate when starting point is off-board', () => {
            // Configuration pour simuler une trajectoire où previousCoord est hors du plateau
            // et currentCoord est dans le plateau.
            (service as unknown).previousCoord = { x: -10, y: -10 };
            (service as unknown).currentCoord = { x: 10, y: 10 };
            (service as unknown).isTilesBeingApplied = true;
            const updateTileSpy = spyOn<unknown>(service, 'updateTile').and.callThrough();

            service.handleMouseMove(dummyRect);

            // La méthode screenToBoard convertit (10,10) en { x: 1, y: 1 } (car 10/10=1)
            expect(updateTileSpy).toHaveBeenCalledWith(1, 1);
            // Les flags doivent être réinitialisés
            expect((service as unknown).isTilesBeingApplied).toBeFalse();
            expect((service as unknown).isTilesBeingDeleted).toBeFalse();
        });
    });

    // ================== Tests issus du second fichier ==================
    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('handleMouseUp', () => {
        it('should reset left click flag for left button', () => {
            (service as unknown).isTilesBeingApplied = true;

            service.handleMouseUp(new MouseEvent('mouseup', { button: 0 }));

            expect((service as unknown).isTilesBeingApplied).toBeFalse();
            expect((service as unknown).previousCoord).toEqual({ x: -1, y: -1 });
        });

        it('should reset right click flag for right button', () => {
            (service as unknown).isTilesBeingDeleted = true;

            service.handleMouseUp(new MouseEvent('mouseup', { button: 2 }));

            expect((service as unknown).isTilesBeingDeleted).toBeFalse();
            expect((service as unknown).previousCoord).toEqual({ x: -1, y: -1 });
        });
    });

    describe('handleMouseMove', () => {
        it('should update intermediate tiles and previousCoord when tiles are being applied', () => {
            (service as unknown).isTilesBeingApplied = true;
            (service as unknown).previousCoord = { x: 30, y: 30 };
            currentCoordSubject.next({ x: 40, y: 40 });

            const updateIntermediateTilesSpy = spyOn<unknown>(service, 'updateIntermediateTiles');

            service.handleMouseMove(rect);

            expect(updateIntermediateTilesSpy).toHaveBeenCalledWith({ x: 30, y: 30 }, rect);
            expect((service as unknown).previousCoord).toEqual({ x: 40, y: 40 });
        });

        it('should update intermediate tiles and previousCoord when tiles are being deleted', () => {
            (service as unknown).isTilesBeingDeleted = true;
            (service as unknown).previousCoord = { x: 50, y: 50 };
            currentCoordSubject.next({ x: 60, y: 60 });

            const updateIntermediateTilesSpy = spyOn<unknown>(service, 'updateIntermediateTiles');

            service.handleMouseMove(rect);

            expect(updateIntermediateTilesSpy).toHaveBeenCalledWith({ x: 50, y: 50 }, rect);
            expect((service as unknown).previousCoord).toEqual({ x: 60, y: 60 });
        });

        it('should not update intermediate tiles when neither applying nor deleting', () => {
            (service as unknown).isTilesBeingApplied = false;
            (service as unknown).isTilesBeingDeleted = false;

            const updateIntermediateTilesSpy = spyOn<unknown>(service, 'updateIntermediateTiles');

            service.handleMouseMove(rect);

            expect(updateIntermediateTilesSpy).not.toHaveBeenCalled();
        });
    });

    describe('updateIntermediateTiles', () => {
        beforeEach(() => {
            spyOn<unknown>(service, 'isOnBoard').and.callFake((x: number, y: number, r: DOMRect) => {
                return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
            });

            spyOn<unknown>(service, 'screenToBoard').and.callFake((x: number, y: number, r: DOMRect) => {
                const cellWidth = r.width / boardSize;
                const cellHeight = r.height / boardSize;
                const tileX = Math.floor((x - r.left) / cellWidth);
                const tileY = Math.floor((y - r.top) / cellHeight);
                return { x: tileX, y: tileY };
            });
        });

        it('should update tiles along a horizontal line (right direction)', () => {
            (service as unknown).currentCoord = { x: 50, y: 10 };
            const previousCoord = { x: 10, y: 10 };

            const updateTileSpy = spyOn<unknown>(service, 'updateTile');

            (service as unknown).updateIntermediateTiles(previousCoord, rect);

            expect(updateTileSpy).toHaveBeenCalled();
            expect(updateTileSpy.calls.count()).toBeGreaterThan(0);
        });

        it('should update tiles along a horizontal line (left direction)', () => {
            (service as unknown).currentCoord = { x: 10, y: 10 };
            const previousCoord = { x: 50, y: 10 };

            const updateTileSpy = spyOn<unknown>(service, 'updateTile');

            (service as unknown).updateIntermediateTiles(previousCoord, rect);

            expect(updateTileSpy).toHaveBeenCalled();
            expect(updateTileSpy.calls.count()).toBeGreaterThan(0);
        });

        it('should update tiles along a vertical line', () => {
            (service as unknown).currentCoord = { x: 10, y: 50 };
            const previousCoord = { x: 10, y: 10 };

            const updateTileSpy = spyOn<unknown>(service, 'updateTile');

            (service as unknown).updateIntermediateTiles(previousCoord, rect);

            expect(updateTileSpy).toHaveBeenCalled();
            expect(updateTileSpy.calls.count()).toBeGreaterThan(0);
        });

        it('should update tiles along a diagonal line', () => {
            (service as unknown).currentCoord = { x: 50, y: 50 };
            const previousCoord = { x: 10, y: 10 };

            const updateTileSpy = spyOn<unknown>(service, 'updateTile');

            (service as unknown).updateIntermediateTiles(previousCoord, rect);

            expect(updateTileSpy).toHaveBeenCalled();
            expect(updateTileSpy.calls.count()).toBeGreaterThan(0);
        });

        it('should reset flags if a coordinate is off board', () => {
            (service as unknown).currentCoord = { x: 250, y: 10 };
            const previousCoord = { x: 10, y: 10 };
            (service as unknown).isTilesBeingApplied = true;
            (service as unknown).isTilesBeingDeleted = true;

            // Reconfigurer isOnBoard pour retourner false si x > 200 ou y > 200
            const isOnBoardSpy = service['isOnBoard'] as jasmine.Spy;
            isOnBoardSpy.and.callFake((x: number, y: number) => x < 200 && y < 200);

            (service as unknown).updateIntermediateTiles(previousCoord, rect);

            expect((service as unknown).isTilesBeingApplied).toBeFalse();
            expect((service as unknown).isTilesBeingDeleted).toBeFalse();
        });
    });

    describe('updateTile', () => {
        it('should call revertToFLOOR when tiles are being deleted', () => {
            (service as unknown).isTilesBeingDeleted = true;
            (service as unknown).isTilesBeingApplied = false;

            const revertToFLOORSpy = spyOn<unknown>(service, 'revertToFLOOR');
            const applyTileSpy = spyOn<unknown>(service, 'applyTile');

            (service as unknown).updateTile(1, 1);

            expect(revertToFLOORSpy).toHaveBeenCalledWith(1, 1);
            expect(applyTileSpy).not.toHaveBeenCalled();
        });

        it('should call applyTile when tiles are being applied', () => {
            (service as unknown).isTilesBeingDeleted = false;
            (service as unknown).isTilesBeingApplied = true;

            const revertToFLOORSpy = spyOn<unknown>(service, 'revertToFLOOR');
            const applyTileSpy = spyOn<unknown>(service, 'applyTile');

            (service as unknown).updateTile(2, 2);

            expect(applyTileSpy).toHaveBeenCalledWith(2, 2);
            expect(revertToFLOORSpy).not.toHaveBeenCalled();
        });

        it('should not call any method when neither applying nor deleting', () => {
            (service as unknown).isTilesBeingDeleted = false;
            (service as unknown).isTilesBeingApplied = false;

            const revertToFLOORSpy = spyOn<unknown>(service, 'revertToFLOOR');
            const applyTileSpy = spyOn<unknown>(service, 'applyTile');

            (service as unknown).updateTile(3, 3);

            expect(revertToFLOORSpy).not.toHaveBeenCalled();
            expect(applyTileSpy).not.toHaveBeenCalled();
        });
    });

    describe('applyTile', () => {
        it('should do nothing if selectedTile is null', () => {
            (service as unknown).selectedTile = null;

            const applyWallSpy = spyOn<unknown>(service, 'applyWall');
            const applyDoorSpy = spyOn<unknown>(service, 'applyDoor');

            (service as unknown).applyTile(1, 1);

            expect(mapServiceSpy.setCellTile).not.toHaveBeenCalled();
            expect(applyWallSpy).not.toHaveBeenCalled();
            expect(applyDoorSpy).not.toHaveBeenCalled();
        });

        it('should call applyWall if selectedTile is WALL', () => {
            (service as unknown).selectedTile = Tile.WALL;

            const applyWallSpy = spyOn<unknown>(service, 'applyWall');

            (service as unknown).applyTile(2, 2);

            expect(applyWallSpy).toHaveBeenCalledWith(2, 2);
            expect(mapServiceSpy.setCellTile).not.toHaveBeenCalled();
        });

        it('should call applyDoor if selectedTile is CLOSED_DOOR', () => {
            (service as unknown).selectedTile = Tile.CLOSED_DOOR;

            const applyDoorSpy = spyOn<unknown>(service, 'applyDoor');

            (service as unknown).applyTile(3, 3);

            expect(applyDoorSpy).toHaveBeenCalledWith(3, 3);
            expect(mapServiceSpy.setCellTile).not.toHaveBeenCalled();
        });

        it('should directly set the cell tile for any other tile value', () => {
            (service as unknown).selectedTile = Tile.FLOOR;

            (service as unknown).applyTile(4, 4);

            expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(4, 4, Tile.FLOOR);
        });
    });

    describe('revertToFLOOR', () => {
        it('should set cell tile to FLOOR if current tile is not FLOOR', () => {
            mapServiceSpy.getCellTile.and.returnValue(Tile.WALL);

            (service as unknown).revertToFLOOR(5, 5);

            expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(5, 5, Tile.FLOOR);
        });

        it('should not set cell tile if current tile is already FLOOR', () => {
            mapServiceSpy.getCellTile.and.returnValue(Tile.FLOOR);

            (service as unknown).revertToFLOOR(6, 6);

            expect(mapServiceSpy.setCellTile).not.toHaveBeenCalled();
        });
    });

    describe('applyDoor', () => {
        it('should clear the cell item if it is not DEFAULT', () => {
            mapServiceSpy.getCellItem.and.returnValue(Item.SPAWN);

            (service as unknown).applyDoor(7, 7);

            expect(mapServiceSpy.setCellItem).toHaveBeenCalledWith(7, 7, Item.DEFAULT);
        });

        it('should not clear the cell item if it is DEFAULT', () => {
            mapServiceSpy.getCellItem.and.returnValue(Item.DEFAULT);

            (service as unknown).applyDoor(8, 8);

            expect(mapServiceSpy.setCellItem).not.toHaveBeenCalled();
        });

        it('should set tile to OPENED_DOOR if current tile is CLOSED_DOOR', () => {
            mapServiceSpy.getCellTile.and.returnValue(Tile.CLOSED_DOOR);

            (service as unknown).applyDoor(9, 9);

            expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(9, 9, Tile.OPENED_DOOR);
        });

        it('should set tile to CLOSED_DOOR if current tile is not CLOSED_DOOR', () => {
            mapServiceSpy.getCellTile.and.returnValue(Tile.FLOOR);

            (service as unknown).applyDoor(0, 0);

            expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(0, 0, Tile.CLOSED_DOOR);
        });
    });

    describe('applyWall', () => {
        it('should clear the cell item if it is not DEFAULT', () => {
            mapServiceSpy.getCellItem.and.returnValue(Item.CHEST);

            (service as unknown).applyWall(1, 2);

            expect(mapServiceSpy.setCellItem).toHaveBeenCalledWith(1, 2, Item.DEFAULT);
        });

        it('should not clear the cell item if it is DEFAULT', () => {
            mapServiceSpy.getCellItem.and.returnValue(Item.DEFAULT);

            (service as unknown).applyWall(2, 3);

            expect(mapServiceSpy.setCellItem).not.toHaveBeenCalled();
        });

        it('should set tile to WALL', () => {
            (service as unknown).applyWall(3, 4);

            expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(3, 4, Tile.WALL);
        });
    });

    describe('screenToBoard', () => {
        it('should convert screen coordinates to board coordinates', () => {
            const x = 50;
            const y = 60;
            const cellWidth = rect.width / boardSize;
            const cellHeight = rect.height / boardSize;

            const result = (service as unknown).screenToBoard(x, y, rect);

            expect(result).toEqual({ x: Math.floor(50 / cellWidth), y: Math.floor(60 / cellHeight) });
            // Par exemple, avec cellWidth = 20 et cellHeight = 20 : floor(50/20)=2, floor(60/20)=3
            expect(result).toEqual({ x: 2, y: 3 });
        });
    });

    describe('isOnBoard', () => {
        it('should return true for coordinates inside the board', () => {
            expect((service as unknown).isOnBoard(10, 10, rect)).toBeTrue();
            expect((service as unknown).isOnBoard(0, 0, rect)).toBeTrue();
            expect((service as unknown).isOnBoard(199, 199, rect)).toBeTrue();
        });

        it('should return false for coordinates outside the board', () => {
            expect((service as unknown).isOnBoard(-1, 10, rect)).toBeFalse();
            expect((service as unknown).isOnBoard(10, -1, rect)).toBeFalse();
            expect((service as unknown).isOnBoard(201, 10, rect)).toBeFalse();
            expect((service as unknown).isOnBoard(10, 201, rect)).toBeFalse();
        });
    });
});
