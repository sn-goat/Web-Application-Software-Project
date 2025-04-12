import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MapService } from '@app/services/map/map.service';
import { MouseEditorService } from '@app/services/mouse-editor/mouse-editor.service';
import { ToolSelectionService } from '@app/services/tool-selection/tool-selection.service';

import { Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { DEFAULT_POSITION_BEFORE_GAME } from '@common/player';

@Injectable({
    providedIn: 'root',
})
export class TileApplicatorService {
    private mouseEditorService = inject(MouseEditorService);
    private toolSelection = inject(ToolSelectionService);
    private mapService = inject(MapService);

    private previousCoord: Vec2 = DEFAULT_POSITION_BEFORE_GAME;

    private isTilesBeingApplied: boolean = false;
    private isTilesBeingDeleted: boolean = false;

    private selectedTile: Tile | null;
    private currentCoord: Vec2 = DEFAULT_POSITION_BEFORE_GAME;

    constructor() {
        this.mouseEditorService.currentCoord$.pipe(takeUntilDestroyed()).subscribe((coord) => {
            this.currentCoord = coord;
        });

        this.toolSelection.selectedTile$.pipe(takeUntilDestroyed()).subscribe((tile) => {
            this.selectedTile = tile;
        });
    }

    handleMouseDown(event: MouseEvent, rect: DOMRect) {
        this.previousCoord = { x: event.pageX, y: event.pageY };
        const cellPosition = this.screenToBoard(this.previousCoord.x, this.previousCoord.y, rect);
        if (!(this.mapService.getCellItem(cellPosition.x, cellPosition.y) === Item.Default)) {
            return;
        }

        this.isTilesBeingDeleted = event.button === 2 ? true : this.isTilesBeingDeleted;
        this.isTilesBeingApplied = event.button === 0 ? true : this.isTilesBeingApplied;

        this.updateTile(cellPosition.x, cellPosition.y);
    }

    handleMouseUp(event: MouseEvent) {
        if (event.button === 2) {
            this.isTilesBeingDeleted = false;
        }
        if (event.button === 0) {
            this.isTilesBeingApplied = false;
        }
        this.previousCoord = { x: -1, y: -1 };
    }

    handleMouseMove(rect: DOMRect) {
        if (this.isTilesBeingApplied || this.isTilesBeingDeleted) {
            this.processLine(this.previousCoord, rect);
            this.previousCoord = this.currentCoord;
        }
    }
    private processLine(previousCoord: { x: number; y: number }, rect: DOMRect): void {
        const { x: startX, y: startY } = previousCoord;
        const { x: endX, y: endY } = this.currentCoord;

        let [x, y] = [startX, startY];
        const dx = Math.abs(endX - startX);
        const dy = Math.abs(endY - startY);
        const sx = Math.sign(endX - startX);
        const sy = Math.sign(endY - startY);
        let err = dx - dy;

        const tilesVisited: Set<string> = new Set();

        while (x !== endX || y !== endY) {
            if (!this.isOnBoard(x, y, rect)) {
                this.isTilesBeingApplied = false;
                this.isTilesBeingDeleted = false;
                break;
            }

            this.processTile(x, y, rect, tilesVisited);

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }

        if (this.isOnBoard(endX, endY, rect)) {
            this.processTile(endX, endY, rect, tilesVisited);
        }
    }

    private processTile(x: number, y: number, rect: DOMRect, tilesVisited: Set<string>): void {
        const tileCoord = this.screenToBoard(x, y, rect);
        const tileCoordKey = JSON.stringify(tileCoord);

        if (!tilesVisited.has(tileCoordKey)) {
            this.updateTile(tileCoord.x, tileCoord.y);
            tilesVisited.add(tileCoordKey);
        }
    }

    private updateTile(col: number, row: number) {
        if (this.isTilesBeingDeleted) {
            this.revertToFLOOR(col, row);
        } else if (this.isTilesBeingApplied) {
            this.applyTile(col, row);
        }
    }

    private applyTile(col: number, row: number) {
        if (this.selectedTile !== null) {
            if (this.selectedTile === Tile.Wall) {
                this.applyWall(col, row);
            } else if (this.selectedTile === Tile.ClosedDoor) {
                this.applyDoor(col, row);
            } else {
                this.mapService.setCellTile(col, row, this.selectedTile as Tile);
            }
        }
    }

    private revertToFLOOR(col: number, row: number) {
        if (this.mapService.getCellTile(col, row) !== Tile.Floor) {
            this.mapService.setCellTile(col, row, Tile.Floor);
        }
    }

    private applyDoor(col: number, row: number) {
        if (this.mapService.getCellItem(col, row) !== Item.Default) {
            this.mapService.setCellItem(col, row, Item.Default);
        }
        if (this.mapService.getCellTile(col, row) === Tile.ClosedDoor) {
            this.mapService.setCellTile(col, row, Tile.OpenedDoor);
        } else {
            this.mapService.setCellTile(col, row, Tile.ClosedDoor);
        }
    }

    private applyWall(col: number, row: number) {
        if (this.mapService.getCellItem(col, row) !== Item.Default) {
            this.mapService.setCellItem(col, row, Item.Default);
        }
        this.mapService.setCellTile(col, row, Tile.Wall);
    }

    private screenToBoard(x: number, y: number, rect: DOMRect): Vec2 {
        const coordX = Math.floor(x - rect.left);
        const coordY = Math.floor(y - rect.top);
        const cellWidth = rect.width / this.mapService.getBoardSize();
        const cellHeight = rect.height / this.mapService.getBoardSize();

        const tileX = Math.floor(coordX / cellWidth);
        const tileY = Math.floor(coordY / cellHeight);
        const tileCoord: Vec2 = { x: tileX, y: tileY };
        return tileCoord;
    }

    private isOnBoard(x: number, y: number, rect: DOMRect): boolean {
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }
}
