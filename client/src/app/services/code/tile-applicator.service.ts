import { Injectable, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { MapService } from './map.service';
import { MouseEditorService } from './mouse-editor.service';
import { ToolSelectionService } from './tool-selection.service';

import { Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';

@Injectable({
    providedIn: 'root',
})
export class TileApplicatorService implements OnDestroy {
    private destroy$ = new Subject<void>();
    private previousCoord: Vec2 = { x: -1, y: -1 };
    private oldItemPos: Vec2 = { x: -1, y: -1 };
    private newItemPos: Vec2 = { x: -1, y: -1 };
    private handleItem: boolean = false;
    private isMouseLeftDown: boolean = false;
    private isMouseRightDown: boolean = false;
    private isOnItem: Item = Item.DEFAULT;

    private selectedTile: Tile | null;
    private selectedItem: Item | null;
    private currentCoord: Vec2 = { x: -1, y: -1 };

    constructor(
        private mouseEditorService: MouseEditorService,
        private toolSelection: ToolSelectionService,
        private mapService: MapService,
    ) {
        this.mouseEditorService.currentCoord$.pipe(takeUntil(this.destroy$)).subscribe((coord) => {
            this.currentCoord = coord;
        });

        this.toolSelection.selectedTile$.pipe(takeUntil(this.destroy$)).subscribe((tile) => {
            this.selectedTile = tile;
        });

        this.toolSelection.selectedItem$.pipe(takeUntil(this.destroy$)).subscribe((item) => {
            this.selectedItem = item;
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    handleMouseDown(event: MouseEvent, rect: DOMRect) {
        this.previousCoord = this.currentCoord;
        const cellPosition = this.screenToBoard(this.previousCoord.x, this.previousCoord.y, rect);

        if (event.button === 2) {
            this.isMouseRightDown = true;
            if (this.mapService.getCellItem(cellPosition.x, cellPosition.y) !== Item.DEFAULT) {
                this.handleItem = true;
                this.deleteItem(cellPosition.x, cellPosition.y);
            }
        }
        if (event.button === 0) {
            this.isMouseLeftDown = true;
            if (this.mapService.getCellItem(cellPosition.x, cellPosition.y) !== Item.DEFAULT) {
                this.handleItem = true;
                this.oldItemPos = this.screenToBoard(this.currentCoord.x, this.currentCoord.y, rect);
            }
        }

        this.updateCell(cellPosition.x, cellPosition.y);
    }

    handleMouseUp(event: MouseEvent) {
        if (event.button === 2) {
            this.handleItem = false;
            this.isMouseRightDown = false;
        }
        if (event.button === 0) {
            this.isMouseLeftDown = false;
        }
        this.previousCoord = { x: -1, y: -1 };
    }

    handleMouseLeave() {
        this.handleItem = false;
    }

    handleMouseMove(rect: DOMRect) {
        if (!this.handleItem) {
            this.applyIntermediateTiles(this.previousCoord, rect);
            this.previousCoord = this.currentCoord;
        }
    }

    setItemOutsideBoard(x: number, y: number, rect: DOMRect) {
        if (!this.isOnBoard(x, y, rect)) {
            if (this.isOnItem) {
                if (this.oldItemPos.x !== -1 && this.oldItemPos.y !== -1) {
                    if (this.isOnItem === this.mapService.getCellItem(this.oldItemPos.x, this.oldItemPos.y)) {
                        this.setDropOnItem(Item.DEFAULT);
                        this.deleteItem(this.oldItemPos.x, this.oldItemPos.y);
                    }
                }
            } else {
                this.oldItemPos = { x: -1, y: -1 };
            }
        }
    }

    setDropOnItem(item: Item) {
        this.isOnItem = item;
    }

    handleDrop(rect: DOMRect) {
        if (this.selectedItem !== Item.DEFAULT) {
            this.newItemPos = this.screenToBoard(this.currentCoord.x, this.currentCoord.y, rect);
            this.updatePosition(this.oldItemPos, this.newItemPos);
        }

        this.oldItemPos = { x: -1, y: -1 };
        this.toolSelection.updateSelectedItem(Item.DEFAULT);
        this.isMouseLeftDown = false;
        this.isMouseRightDown = false;
        this.handleItem = false;
    }

    private isOnBoard(x: number, y: number, rect: DOMRect): boolean {
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
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

    private applyIntermediateTiles(previousCoord: Vec2, rect: DOMRect) {
        const startX = previousCoord.x;
        const startY = previousCoord.y;
        const endX = this.currentCoord.x;
        const endY = this.currentCoord.y;

        const dx = Math.abs(endX - startX);
        const dy = Math.abs(endY - startY);
        const sx = startX < endX ? 1 : -1;
        const sy = startY < endY ? 1 : -1;
        let err = dx - dy;

        const seen: Set<string> = new Set([JSON.stringify(this.screenToBoard(startX, startY, rect))]);

        let x = startX;
        let y = startY;

        while (x !== endX || y !== endY) {
            if (!this.isOnBoard(x, y, rect)) {
                this.isMouseLeftDown = false;
                this.isMouseRightDown = false;
                break;
            }

            const tileCoord = this.screenToBoard(x, y, rect);
            const tileCoordKey = JSON.stringify(tileCoord);
            if (!seen.has(tileCoordKey)) {
                this.updateCell(tileCoord.x, tileCoord.y);
                seen.add(tileCoordKey);
            }

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
            const tileCoord = this.screenToBoard(endX, endY, rect);
            const tileCoordKey = JSON.stringify(tileCoord);
            if (!seen.has(tileCoordKey)) {
                this.updateCell(tileCoord.x, tileCoord.y);
                seen.add(tileCoordKey);
            }
        }
    }

    private applyTile(col: number, row: number) {
        if (this.selectedTile !== null) {
            if (this.selectedTile === Tile.WALL) {
                this.applyWall(col, row);
            } else if (this.selectedTile === Tile.CLOSED_DOOR) {
                this.applyDoor(col, row);
            } else {
                this.mapService.setCellTile(col, row, this.selectedTile as Tile);
            }
        }
    }

    private applyDoor(col: number, row: number) {
        if (this.mapService.getCellItem(col, row) !== Item.DEFAULT) {
            this.deleteItem(col, row);
        }
        if (this.mapService.getCellTile(col, row) === Tile.CLOSED_DOOR) {
            this.mapService.setCellTile(col, row, Tile.OPENED_DOOR);
        } else {
            this.mapService.setCellTile(col, row, Tile.CLOSED_DOOR);
        }
    }

    private applyWall(col: number, row: number) {
        if (this.mapService.getCellItem(col, row) !== Item.DEFAULT) {
            this.deleteItem(col, row);
        }
        this.mapService.setCellTile(col, row, Tile.WALL);
    }

    private revertToFLOOR(col: number, row: number) {
        if (this.mapService.getCellTile(col, row) !== Tile.FLOOR) {
            this.mapService.setCellTile(col, row, Tile.FLOOR);
        }
    }

    private updateCell(col: number, row: number) {
        if (!this.handleItem) {
            if (this.isMouseRightDown) {
                this.revertToFLOOR(col, row);
            } else if (this.isMouseLeftDown) {
                this.applyTile(col, row);
            }
        }
    }

    private applyItem(col: number, row: number) {
        if (this.selectedItem === Item.SPAWN) {
            this.toolSelection.incrementSpawn();
        } else if (this.selectedItem === Item.CHEST) {
            this.toolSelection.incrementChest();
        } else {
            this.toolSelection.addItem(this.selectedItem as Item);
        }

        if (this.mapService.getCellItem(col, row) !== Item.DEFAULT) {
            this.deleteItem(col, row);
        }
        this.mapService.setCellItem(col, row, this.selectedItem as Item);
    }
    private deleteItem(col: number, row: number) {
        if (this.mapService.getCellItem(col, row) === Item.SPAWN) {
            this.toolSelection.decrementSpawn();
        } else if (this.mapService.getCellItem(col, row) === Item.CHEST) {
            this.toolSelection.decrementChest();
        } else {
            this.toolSelection.removeItem(this.mapService.getCellItem(col, row));
        }
        this.mapService.setCellItem(col, row, Item.DEFAULT);
    }

    private updatePosition(oldItemPos: Vec2, newItemPos: Vec2) {
        if (
            this.mapService.getCellTile(newItemPos.x, newItemPos.y) !== Tile.WALL &&
            this.mapService.getCellTile(newItemPos.x, newItemPos.y) !== Tile.OPENED_DOOR &&
            this.mapService.getCellTile(newItemPos.x, newItemPos.y) !== Tile.CLOSED_DOOR
        ) {
            if (oldItemPos.x !== -1 && oldItemPos.y !== -1) {
                this.deleteItem(oldItemPos.x, oldItemPos.y);
            }
            this.applyItem(newItemPos.x, newItemPos.y);
        }
    }
}
