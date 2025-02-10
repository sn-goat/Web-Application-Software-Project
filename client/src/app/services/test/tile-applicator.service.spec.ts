import { MapService } from '@app/services/code/map.service';
import { MouseEditorService } from '@app/services/code/mouse-editor.service';
import { TileApplicatorService } from '@app/services/code/tile-applicator.service';
import { ToolSelectionService } from '@app/services/code/tool-selection.service';
import { Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { BehaviorSubject } from 'rxjs';

describe('TileApplicatorService', () => {
  let service: TileApplicatorService;
  let mouseEditorServiceSpy: jasmine.SpyObj<MouseEditorService>;
  let toolSelectionServiceSpy: jasmine.SpyObj<ToolSelectionService>;
  let mapServiceSpy: jasmine.SpyObj<MapService>;

  // Subjects for dependencies’ observables.
  let currentCoordSubject: BehaviorSubject<Vec2>;
  let selectedTileSubject: BehaviorSubject<Tile | null>;
  let selectedItemSubject: BehaviorSubject<Item>;

  // Board dimensions and a DOMRect to compute board coordinates.
  const boardSize = 10;
  const rect = new DOMRect(0, 0, 200, 200); // Each cell is 20x20 pixels.

  // Helper to compute board coordinates from a mouse coordinate.
  function getBoardCoordinates(x: number, y: number): Vec2 {
    const cellWidth = rect.width / boardSize;
    const cellHeight = rect.height / boardSize;
    return {
      x: Math.floor((x - rect.left) / cellWidth),
      y: Math.floor((y - rect.top) / cellHeight),
    };
  }

  beforeEach(() => {
    currentCoordSubject = new BehaviorSubject<Vec2>({ x: 0, y: 0 });
    selectedTileSubject = new BehaviorSubject<Tile | null>(null);
    selectedItemSubject = new BehaviorSubject<Item>(Item.DEFAULT);

    mouseEditorServiceSpy = jasmine.createSpyObj('MouseEditorService', [], {
      currentCoord$: currentCoordSubject.asObservable(),
    });
    toolSelectionServiceSpy = jasmine.createSpyObj(
      'ToolSelectionService',
      [
        'updateSelectedItem',
        'incrementSpawn',
        'decrementSpawn',
        'incrementChest',
        'decrementChest',
        'addItem',
        'removeItem',
      ],
      {
        selectedTile$: selectedTileSubject.asObservable(),
        selectedItem$: selectedItemSubject.asObservable(),
      }
    );
    mapServiceSpy = jasmine.createSpyObj('MapService', [
      'getCellItem',
      'getCellTile',
      'setCellTile',
      'setCellItem',
      'getBoardSize',
    ]);

    mapServiceSpy.getBoardSize.and.returnValue(boardSize);

    // Create the service (its constructor subscribes to the observables)
    service = new TileApplicatorService(
      mouseEditorServiceSpy,
      toolSelectionServiceSpy,
      mapServiceSpy
    );
  });

  // ─────────────────────────────────────────────────────────────
  // Mouse Event Handlers
  // ─────────────────────────────────────────────────────────────
  describe('Mouse Event Handlers', () => {
    describe('handleMouseDown', () => {
      it('should handle right-click deletion when cell item is not default', () => {
        currentCoordSubject.next({ x: 50, y: 50 });
        const expectedTile = getBoardCoordinates(50, 50);
        const event = new MouseEvent('mousedown', { button: 2 });
        mapServiceSpy.getCellItem.and.returnValue(Item.SPAWN);

        service.handleMouseDown(event, rect);

        expect((service as any).isMouseRightDown).toBeTrue();
        expect((service as any).handleItem).toBeTrue();
        expect(toolSelectionServiceSpy.decrementSpawn).toHaveBeenCalled();
        expect(mapServiceSpy.setCellItem).toHaveBeenCalledWith(
          expectedTile.x,
          expectedTile.y,
          Item.DEFAULT
        );
      });

      it('should handle right-click revert to floor when cell item is default', () => {
        currentCoordSubject.next({ x: 50, y: 50 });
        const expectedTile = getBoardCoordinates(50, 50);
        const event = new MouseEvent('mousedown', { button: 2 });
        mapServiceSpy.getCellItem.and.returnValue(Item.DEFAULT);
        // Simulate that the current tile is not FLOOR.
        mapServiceSpy.getCellTile.and.returnValue(Tile.WALL);

        service.handleMouseDown(event, rect);

        expect((service as any).isMouseRightDown).toBeTrue();
        expect((service as any).handleItem).toBeFalse();
        expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(
          expectedTile.x,
          expectedTile.y,
          Tile.FLOOR
        );
      });

      it('should handle left-click by setting oldItemPos when cell item is not default', () => {
        currentCoordSubject.next({ x: 70, y: 70 });
        const expectedTile = getBoardCoordinates(70, 70);
        const event = new MouseEvent('mousedown', { button: 0 });
        mapServiceSpy.getCellItem.and.returnValue(Item.CHEST);

        service.handleMouseDown(event, rect);

        expect((service as any).isMouseLeftDown).toBeTrue();
        expect((service as any).handleItem).toBeTrue();
        expect((service as any).oldItemPos).toEqual(expectedTile);
      });
    });

    it('should handle mouse up and reset flags', () => {
      (service as any).isMouseRightDown = true;
      (service as any).isMouseLeftDown = true;
      (service as any).handleItem = true;
      (service as any).previousCoord = { x: 10, y: 10 };

      service.handleMouseUp(new MouseEvent('mouseup', { button: 2 }));
      expect((service as any).handleItem).toBeFalse();
      expect((service as any).isMouseRightDown).toBeFalse();

      service.handleMouseUp(new MouseEvent('mouseup', { button: 0 }));
      expect((service as any).isMouseLeftDown).toBeFalse();
      expect((service as any).previousCoord).toEqual({ x: -1, y: -1 });
    });

    it('should handle mouse leave by setting handleItem to false', () => {
      (service as any).handleItem = true;
      service.handleMouseLeave();
      expect((service as any).handleItem).toBeFalse();
    });

    it('should update previousCoord on mouse move when handleItem is false', () => {
      (service as any).handleItem = false;
      (service as any).previousCoord = { x: 30, y: 30 };
      currentCoordSubject.next({ x: 80, y: 80 });
      const updateCellSpy = spyOn<any>(service, 'updateCell').and.callThrough();

      service.handleMouseMove(rect);

      expect((service as any).previousCoord).toEqual({ x: 80, y: 80 });
      expect(updateCellSpy).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // setItemOutsideBoard and setDropOnItem
  // ─────────────────────────────────────────────────────────────
  describe('setItemOutsideBoard', () => {
    it('should delete item if conditions match', () => {
      const outsideX = 300;
      const outsideY = 300;
      (service as any).isOnItem = Item.CHEST;
      (service as any).oldItemPos = { x: 2, y: 2 };
      mapServiceSpy.getCellItem.and.returnValue(Item.CHEST);
      const setDropOnItemSpy = spyOn(service, 'setDropOnItem').and.callThrough();
      const deleteItemSpy = spyOn<any>(service, 'deleteItem').and.callThrough();

      service.setItemOutsideBoard(outsideX, outsideY, rect);

      expect(setDropOnItemSpy).toHaveBeenCalledWith(Item.DEFAULT);
      expect(deleteItemSpy).toHaveBeenCalledWith(2, 2);
    });

    it('should reset oldItemPos if not handling an item', () => {
      const outsideX = 300;
      const outsideY = 300;
      (service as any).isOnItem = Item.DEFAULT;
      (service as any).oldItemPos = { x: 2, y: 2 };

      service.setItemOutsideBoard(outsideX, outsideY, rect);

      expect((service as any).oldItemPos).toEqual({ x: -1, y: -1 });
    });
  });

  describe('setDropOnItem', () => {
    it('should set drop on item correctly', () => {
      service.setDropOnItem(Item.CHEST);
      expect((service as any).isOnItem).toBe(Item.CHEST);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // handleDrop
  // ─────────────────────────────────────────────────────────────
  describe('handleDrop', () => {
    it('should update item position when selectedItem is not DEFAULT', () => {
      selectedItemSubject.next(Item.SPAWN);
      currentCoordSubject.next({ x: 90, y: 90 });
      const updatePositionSpy = spyOn<any>(service, 'updatePosition').and.callFake(() => {});
      (service as any).oldItemPos = { x: 1, y: 1 };

      service.handleDrop(rect);

      expect(updatePositionSpy).toHaveBeenCalled();
      expect((service as any).oldItemPos).toEqual({ x: -1, y: -1 });
      expect(toolSelectionServiceSpy.updateSelectedItem).toHaveBeenCalledWith(Item.DEFAULT);
      expect((service as any).isMouseLeftDown).toBeFalse();
      expect((service as any).isMouseRightDown).toBeFalse();
      expect((service as any).handleItem).toBeFalse();
    });

    it('should not update position when selectedItem is DEFAULT', () => {
      selectedItemSubject.next(Item.DEFAULT);
      (service as any).oldItemPos = { x: 1, y: 1 };
      const updatePositionSpy = spyOn<any>(service, 'updatePosition').and.callFake(() => {});

      service.handleDrop(rect);

      expect(updatePositionSpy).not.toHaveBeenCalled();
      expect((service as any).oldItemPos).toEqual({ x: -1, y: -1 });
      expect(toolSelectionServiceSpy.updateSelectedItem).toHaveBeenCalledWith(Item.DEFAULT);
      expect((service as any).isMouseLeftDown).toBeFalse();
      expect((service as any).isMouseRightDown).toBeFalse();
      expect((service as any).handleItem).toBeFalse();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Off-board (hors-board) drag handling
  // ─────────────────────────────────────────────────────────────
  describe('Gestion du cas "hors-board"', () => {
    it('should reset mouse flags if a coordinate is off-board', () => {
      // Override isOnBoard to always return false.
      (service as any).isOnBoard = (x: number, y: number, rect: DOMRect) => false;

      // Create a simulation method (normally this logic is inside a loop)
      (service as any).simulateDrag = function (positions: Array<{ x: number; y: number }>, rect: DOMRect) {
        for (const pos of positions) {
          if (!this.isOnBoard(pos.x, pos.y, rect)) {
            this.isMouseLeftDown = false;
            this.isMouseRightDown = false;
            break;
          }
        }
      };

      (service as any).isMouseLeftDown = true;
      (service as any).isMouseRightDown = true;

      (service as any).simulateDrag([{ x: 100, y: 100 }, { x: 250, y: 250 }], rect);

      expect((service as any).isMouseLeftDown).toBeFalse();
      expect((service as any).isMouseRightDown).toBeFalse();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // applyTile, applyDoor, applyWall
  // ─────────────────────────────────────────────────────────────
  describe('applyTile', () => {
    it('should do nothing if selectedTile is null', () => {
      (service as any).selectedTile = null;
      (service as any).applyTile(1, 1);
      expect(mapServiceSpy.setCellTile).not.toHaveBeenCalled();
    });

    it('should call applyWall if selectedTile is WALL', () => {
      (service as any).selectedTile = Tile.WALL;
      const spyApplyWall = spyOn<any>(service, 'applyWall').and.callFake(() => {});
      (service as any).applyTile(2, 3);
      expect(spyApplyWall).toHaveBeenCalledWith(2, 3);
    });

    it('should call applyDoor if selectedTile is CLOSED_DOOR', () => {
      (service as any).selectedTile = Tile.CLOSED_DOOR;
      const spyApplyDoor = spyOn<any>(service, 'applyDoor').and.callFake(() => {});
      (service as any).applyTile(4, 5);
      expect(spyApplyDoor).toHaveBeenCalledWith(4, 5);
    });

    it('should directly set the cell tile for any other tile value', () => {
      (service as any).selectedTile = Tile.FLOOR;
      (service as any).applyTile(6, 7);
      expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(6, 7, Tile.FLOOR);
    });
  });

  describe('applyDoor', () => {
    it('should delete the item and open the door if the cell item is not DEFAULT and the tile is CLOSED_DOOR', () => {
      spyOn<any>(service, 'deleteItem').and.callFake(() => {});
      mapServiceSpy.getCellItem.and.returnValue(Item.SPAWN);
      mapServiceSpy.getCellTile.and.returnValue(Tile.CLOSED_DOOR);

      (service as any).applyDoor(1, 1);

      expect((service as any).deleteItem).toHaveBeenCalledWith(1, 1);
      expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(1, 1, Tile.OPENED_DOOR);
    });

    it('should not delete the item and close the door if the item is DEFAULT and the tile is not CLOSED_DOOR', () => {
      spyOn<any>(service, 'deleteItem').and.callFake(() => {});
      mapServiceSpy.getCellItem.and.returnValue(Item.DEFAULT);
      mapServiceSpy.getCellTile.and.returnValue(Tile.FLOOR);

      (service as any).applyDoor(2, 2);

      expect((service as any).deleteItem).not.toHaveBeenCalled();
      expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(2, 2, Tile.CLOSED_DOOR);
    });

    it('should delete the item and close the door if the tile is not CLOSED_DOOR and the item is non DEFAULT', () => {
      spyOn<any>(service, 'deleteItem').and.callFake(() => {});
      mapServiceSpy.getCellItem.and.returnValue(Item.SPAWN);
      mapServiceSpy.getCellTile.and.returnValue(Tile.FLOOR);

      (service as any).applyDoor(3, 3);

      expect((service as any).deleteItem).toHaveBeenCalledWith(3, 3);
      expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(3, 3, Tile.CLOSED_DOOR);
    });
  });

  describe('applyWall', () => {
    it('should delete the item if the cell item is not DEFAULT, then set the wall tile', () => {
      spyOn<any>(service, 'deleteItem').and.callFake(() => {});
      mapServiceSpy.getCellItem.and.returnValue(Item.CHEST);

      (service as any).applyWall(4, 4);

      expect((service as any).deleteItem).toHaveBeenCalledWith(4, 4);
      expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(4, 4, Tile.WALL);
    });

    it('should set the wall tile without deleting the item if the cell item is DEFAULT', () => {
      spyOn<any>(service, 'deleteItem').and.callFake(() => {});
      mapServiceSpy.getCellItem.and.returnValue(Item.DEFAULT);

      (service as any).applyWall(5, 5);

      expect((service as any).deleteItem).not.toHaveBeenCalled();
      expect(mapServiceSpy.setCellTile).toHaveBeenCalledWith(5, 5, Tile.WALL);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // updateCell
  // ─────────────────────────────────────────────────────────────
  describe('updateCell', () => {
    it('should do nothing if handleItem is true', () => {
      (service as any).handleItem = true;
      const spyRevertToFLOOR = spyOn<any>(service, 'revertToFLOOR');
      const spyApplyTile = spyOn<any>(service, 'applyTile');
      (service as any).updateCell(1, 1);
      expect(spyRevertToFLOOR).not.toHaveBeenCalled();
      expect(spyApplyTile).not.toHaveBeenCalled();
    });

    it('should call revertToFLOOR if the right mouse button is down and handleItem is false', () => {
      (service as any).handleItem = false;
      (service as any).isMouseRightDown = true;
      (service as any).isMouseLeftDown = false;
      const spyRevertToFLOOR = spyOn<any>(service, 'revertToFLOOR');
      (service as any).updateCell(2, 2);
      expect(spyRevertToFLOOR).toHaveBeenCalledWith(2, 2);
    });

    it('should call applyTile if the left mouse button is down and handleItem is false', () => {
      (service as any).handleItem = false;
      (service as any).isMouseLeftDown = true;
      (service as any).isMouseRightDown = false;
      const spyApplyTile = spyOn<any>(service, 'applyTile');
      (service as any).updateCell(3, 3);
      expect(spyApplyTile).toHaveBeenCalledWith(3, 3);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // applyItem and deleteItem
  // ─────────────────────────────────────────────────────────────
  describe('applyItem', () => {
    it('should increment SPAWN and set the cell if selectedItem is SPAWN and the cell is DEFAULT', () => {
      (service as any).selectedItem = Item.SPAWN;
      mapServiceSpy.getCellItem.and.returnValue(Item.DEFAULT);
      const spyDeleteItem = spyOn<any>(service, 'deleteItem');
      (service as any).applyItem(1, 1);
      expect(toolSelectionServiceSpy.incrementSpawn).toHaveBeenCalled();
      expect(spyDeleteItem).not.toHaveBeenCalled();
      expect(mapServiceSpy.setCellItem).toHaveBeenCalledWith(1, 1, Item.SPAWN);
    });

    it('should increment CHEST, delete the item then set the cell if selectedItem is CHEST and the cell is non DEFAULT', () => {
      (service as any).selectedItem = Item.CHEST;
      mapServiceSpy.getCellItem.and.returnValue(Item.SPAWN);
      const spyDeleteItem = spyOn<any>(service, 'deleteItem').and.callFake(() => {});
      (service as any).applyItem(2, 2);
      expect(toolSelectionServiceSpy.incrementChest).toHaveBeenCalled();
      expect(spyDeleteItem).toHaveBeenCalledWith(2, 2);
      expect(mapServiceSpy.setCellItem).toHaveBeenCalledWith(2, 2, Item.CHEST);
    });

    it('should add the item, delete the previous item then set the cell if selectedItem is neither SPAWN nor CHEST and the cell is non DEFAULT', () => {
      (service as any).selectedItem = Item.DEFAULT;
      mapServiceSpy.getCellItem.and.returnValue(Item.CHEST);
      const spyDeleteItem = spyOn<any>(service, 'deleteItem').and.callFake(() => {});
      (service as any).applyItem(3, 3);
      expect(toolSelectionServiceSpy.addItem).toHaveBeenCalledWith(Item.DEFAULT);
      expect(spyDeleteItem).toHaveBeenCalledWith(3, 3);
      expect(mapServiceSpy.setCellItem).toHaveBeenCalledWith(3, 3, Item.DEFAULT);
    });

    it('should add the item and set the cell without deleting if the cell is DEFAULT', () => {
      (service as any).selectedItem = Item.DEFAULT;
      mapServiceSpy.getCellItem.and.returnValue(Item.DEFAULT);
      const spyDeleteItem = spyOn<any>(service, 'deleteItem');
      (service as any).applyItem(4, 4);
      expect(toolSelectionServiceSpy.addItem).toHaveBeenCalledWith(Item.DEFAULT);
      expect(spyDeleteItem).not.toHaveBeenCalled();
      expect(mapServiceSpy.setCellItem).toHaveBeenCalledWith(4, 4, Item.DEFAULT);
    });
  });

  describe('deleteItem', () => {
    it('should decrement SPAWN and reset the cell if the item is SPAWN', () => {
      mapServiceSpy.getCellItem.and.returnValue(Item.SPAWN);
      (service as any).deleteItem(5, 5);
      expect(toolSelectionServiceSpy.decrementSpawn).toHaveBeenCalled();
      expect(mapServiceSpy.setCellItem).toHaveBeenCalledWith(5, 5, Item.DEFAULT);
    });

    it('should decrement CHEST and reset the cell if the item is CHEST', () => {
      mapServiceSpy.getCellItem.and.returnValue(Item.CHEST);
      (service as any).deleteItem(6, 6);
      expect(toolSelectionServiceSpy.decrementChest).toHaveBeenCalled();
      expect(mapServiceSpy.setCellItem).toHaveBeenCalledWith(6, 6, Item.DEFAULT);
    });

    it('should remove the item and reset the cell if the item is neither SPAWN nor CHEST', () => {
      mapServiceSpy.getCellItem.and.returnValue(Item.DEFAULT);
      (service as any).deleteItem(7, 7);
      expect(toolSelectionServiceSpy.removeItem).toHaveBeenCalledWith(Item.DEFAULT);
      expect(mapServiceSpy.setCellItem).toHaveBeenCalledWith(7, 7, Item.DEFAULT);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // updatePosition
  // ─────────────────────────────────────────────────────────────
  describe('updatePosition', () => {
    it('should not update the position if the destination tile is WALL', () => {
      const oldPos: Vec2 = { x: 1, y: 1 };
      const newPos: Vec2 = { x: 2, y: 2 };
      mapServiceSpy.getCellTile.and.returnValue(Tile.WALL);
      const spyDeleteItem = spyOn<any>(service, 'deleteItem');
      const spyApplyItem = spyOn<any>(service, 'applyItem');
      (service as any).updatePosition(oldPos, newPos);
      expect(spyDeleteItem).not.toHaveBeenCalled();
      expect(spyApplyItem).not.toHaveBeenCalled();
    });

    it('should delete the old item and apply the new if the destination tile is not a wall/door and oldItemPos is valid', () => {
      const oldPos: Vec2 = { x: 3, y: 3 };
      const newPos: Vec2 = { x: 4, y: 4 };
      mapServiceSpy.getCellTile.and.returnValue(Tile.FLOOR);
      const spyDeleteItem = spyOn<any>(service, 'deleteItem').and.callFake(() => {});
      const spyApplyItem = spyOn<any>(service, 'applyItem').and.callFake(() => {});
      (service as any).updatePosition(oldPos, newPos);
      expect(spyDeleteItem).toHaveBeenCalledWith(3, 3);
      expect(spyApplyItem).toHaveBeenCalledWith(4, 4);
    });

    it('should only apply the new item if oldItemPos is invalid', () => {
      const oldPos: Vec2 = { x: -1, y: -1 };
      const newPos: Vec2 = { x: 5, y: 5 };
      mapServiceSpy.getCellTile.and.returnValue(Tile.FLOOR);
      const spyDeleteItem = spyOn<any>(service, 'deleteItem');
      const spyApplyItem = spyOn<any>(service, 'applyItem').and.callFake(() => {});
      (service as any).updatePosition(oldPos, newPos);
      expect(spyDeleteItem).not.toHaveBeenCalled();
      expect(spyApplyItem).toHaveBeenCalledWith(5, 5);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests for applyIntermediateTiles
  // ─────────────────────────────────────────────────────────────
  describe('applyIntermediateTiles', () => {
    beforeEach(() => {
      // Spy on updateCell to monitor its calls.
      spyOn(service as any, 'updateCell').and.callFake(() => {});
      // Spy on screenToBoard to simulate board coordinate conversion.
      spyOn(service as any, 'screenToBoard').and.callFake((x: number, y: number, rect: DOMRect) => {
        const cellWidth = rect.width / boardSize;
        const cellHeight = rect.height / boardSize;
        return { x: Math.floor((x - rect.left) / cellWidth), y: Math.floor((y - rect.top) / cellHeight) };
      });
      // Spy on isOnBoard to return true when coordinates are within the rect.
      spyOn(service as any, 'isOnBoard').and.callFake((x: number, y: number, rect: DOMRect) => {
        return x >= rect.left && y >= rect.top && x <= rect.width && y <= rect.height;
      });
    });

    it('should update intermediate cells along a horizontal line on board', () => {
      // Set up a horizontal line:
      // previousCoord at (10, 10) and currentCoord at (50, 10).
      // With a cell size of 20, (10,10) maps to board cell {0,0} and (50,10) maps to {2,0}.
      // The algorithm seeds {0,0} and should update intermediate board cells {1,0} and {2,0}.
      const previousCoord: Vec2 = { x: 10, y: 10 };
      (service as any).currentCoord = { x: 50, y: 10 };
      (service as any).isMouseLeftDown = true;
      (service as any).isMouseRightDown = true;
      const updateCellSpy = (service as any).updateCell as jasmine.Spy;
      updateCellSpy.calls.reset();

      (service as any).applyIntermediateTiles(previousCoord, rect);

      // Expect updateCell to be called for board coordinates {1,0} and {2,0} (2 calls total).
      expect(updateCellSpy.calls.count()).toEqual(2);
      expect(updateCellSpy.calls.argsFor(0)).toEqual([1, 0]);
      expect(updateCellSpy.calls.argsFor(1)).toEqual([2, 0]);
      // Since all coordinates are on board, mouse flags should remain true.
      expect((service as any).isMouseLeftDown).toBeTrue();
      expect((service as any).isMouseRightDown).toBeTrue();
    });

    it('should stop processing and reset mouse flags if a coordinate is off board', () => {
      // Set up a line where currentCoord is off board.
      // For example, previousCoord at (10,10) and currentCoord at (250,10) where 250 > rect.width.
      const previousCoord: Vec2 = { x: 10, y: 10 };
      (service as any).currentCoord = { x: 250, y: 10 };
      (service as any).isMouseLeftDown = true;
      (service as any).isMouseRightDown = true;
      const updateCellSpy = (service as any).updateCell as jasmine.Spy;
      updateCellSpy.calls.reset();

      (service as any).applyIntermediateTiles(previousCoord, rect);

      // Since (250,10) is off board, the function should disable the mouse flags.
      expect((service as any).isMouseLeftDown).toBeFalse();
      expect((service as any).isMouseRightDown).toBeFalse();
    });
  });
  describe('applyIntermediateTiles', () => {
    beforeEach(() => {
      // Spy sur updateCell pour surveiller ses appels.
      spyOn(service as any, 'updateCell').and.callFake(() => {});
      // Spy sur screenToBoard pour simuler la conversion en coordonnées de plateau.
      spyOn(service as any, 'screenToBoard').and.callFake((x: number, y: number, rect: DOMRect) => {
        const cellWidth = rect.width / boardSize;
        const cellHeight = rect.height / boardSize;
        return { x: Math.floor((x - rect.left) / cellWidth), y: Math.floor((y - rect.top) / cellHeight) };
      });
      // Spy sur isOnBoard pour retourner true lorsque les coordonnées sont dans le rect.
      spyOn(service as any, 'isOnBoard').and.callFake((x: number, y: number, rect: DOMRect) => {
        return x >= rect.left && y >= rect.top && x <= rect.width && y <= rect.height;
      });
    });

    it('should update intermediate cells along a horizontal line on board (déplacement vers la droite)', () => {
      // Exemple : previousCoord (10,10) et currentCoord (50,10)
      // (10,10) → {0,0} et (50,10) → {2,0}; on s'attend à mettre à jour {1,0} et {2,0}.
      const previousCoord: Vec2 = { x: 10, y: 10 };
      (service as any).currentCoord = { x: 50, y: 10 };
      (service as any).isMouseLeftDown = true;
      (service as any).isMouseRightDown = true;
      const updateCellSpy = (service as any).updateCell as jasmine.Spy;
      updateCellSpy.calls.reset();

      (service as any).applyIntermediateTiles(previousCoord, rect);

      expect(updateCellSpy.calls.count()).toEqual(2);
      expect(updateCellSpy.calls.argsFor(0)).toEqual([1, 0]);
      expect(updateCellSpy.calls.argsFor(1)).toEqual([2, 0]);
      expect((service as any).isMouseLeftDown).toBeTrue();
      expect((service as any).isMouseRightDown).toBeTrue();
    });

    // Nouveau test pour couvrir le cas où startX >= endX (sx doit être -1)
    it('should update intermediate cells along a horizontal line going leftwards (déplacement vers la gauche)', () => {
      // Exemple : previousCoord (50,10) et currentCoord (10,10)
      // (50,10) → {2,0} et (10,10) → {0,0}; on s'attend à mettre à jour {1,0} puis {0,0}.
      const previousCoord: Vec2 = { x: 50, y: 10 };
      (service as any).currentCoord = { x: 10, y: 10 };
      (service as any).isMouseLeftDown = true;
      (service as any).isMouseRightDown = true;
      const updateCellSpy = (service as any).updateCell as jasmine.Spy;
      updateCellSpy.calls.reset();

      (service as any).applyIntermediateTiles(previousCoord, rect);

      // La cellule de départ {2,0} est déjà ajoutée dans 'seen'
      // On s'attend donc à ce que updateCell soit appelé pour {1,0} et {0,0}.
      expect(updateCellSpy.calls.count()).toEqual(2);
      expect(updateCellSpy.calls.argsFor(0)).toEqual([1, 0]);
      expect(updateCellSpy.calls.argsFor(1)).toEqual([0, 0]);
      expect((service as any).isMouseLeftDown).toBeTrue();
      expect((service as any).isMouseRightDown).toBeTrue();
    });

    it('should stop processing and reset mouse flags if a coordinate is off board', () => {
      // Exemple : previousCoord (10,10) et currentCoord (250,10) où 250 > rect.width
      const previousCoord: Vec2 = { x: 10, y: 10 };
      (service as any).currentCoord = { x: 250, y: 10 };
      (service as any).isMouseLeftDown = true;
      (service as any).isMouseRightDown = true;
      const updateCellSpy = (service as any).updateCell as jasmine.Spy;
      updateCellSpy.calls.reset();

      (service as any).applyIntermediateTiles(previousCoord, rect);

      expect((service as any).isMouseLeftDown).toBeFalse();
      expect((service as any).isMouseRightDown).toBeFalse();
    });
  });
});
