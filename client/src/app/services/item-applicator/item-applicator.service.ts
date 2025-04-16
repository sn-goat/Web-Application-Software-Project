import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MapService } from '@app/services/map/map.service';
import { ToolSelectionService } from '@app/services/tool-selection/tool-selection.service';

import { Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';

@Injectable({
    providedIn: 'root',
})
export class ItemApplicatorService {
    private toolSelection = inject(ToolSelectionService);
    private mapService = inject(MapService);

    private selectedItem: Item | null;
    private oldItemPos: Vec2 = { x: -1, y: -1 };
    private isBackToContainer: boolean = false;

    constructor() {
        this.toolSelection.selectedItem$.pipe(takeUntilDestroyed()).subscribe((item) => {
            this.selectedItem = item;
        });
    }

    handleMouseDown(event: MouseEvent, rect: DOMRect) {
        const cellPosition = this.screenToBoard(event.pageX, event.pageY, rect);
        if (this.mapService.getCellItem(cellPosition.x, cellPosition.y) !== Item.Default) {
            if (event.button === 0) {
                this.oldItemPos = cellPosition;
            } else if (event.button === 2) {
                this.deleteItem(cellPosition.x, cellPosition.y);
            }
        }
    }

    handleMouseUp() {
        this.oldItemPos = { x: -1, y: -1 };
    }

    handleDragEnd(event: DragEvent, rect: DOMRect) {
        if (this.isOnBoard(event.pageX, event.pageY, rect)) {
            const newItemPos = this.screenToBoard(event.pageX, event.pageY, rect);
            this.updatePosition(this.oldItemPos, newItemPos);
        } else if (this.isBackToContainer) {
            this.deleteItem(this.oldItemPos.x, this.oldItemPos.y);
        }
        this.oldItemPos = { x: -1, y: -1 };
    }

    setBackToContainer(item: Item = Item.Default) {
        this.isBackToContainer = item === this.selectedItem;
    }

    private updatePosition(oldItemPos: Vec2, newItemPos: Vec2) {
        if (
            this.mapService.getCellItem(newItemPos.x, newItemPos.y) !== Item.Default &&
            (oldItemPos.x !== newItemPos.x || oldItemPos.y !== newItemPos.y)
        ) {
            return;
        }
        if (
            this.mapService.getCellTile(newItemPos.x, newItemPos.y) !== Tile.Wall &&
            this.mapService.getCellTile(newItemPos.x, newItemPos.y) !== Tile.OpenedDoor &&
            this.mapService.getCellTile(newItemPos.x, newItemPos.y) !== Tile.ClosedDoor
        ) {
            if (oldItemPos.x !== -1 && oldItemPos.y !== -1) {
                this.deleteItem(oldItemPos.x, oldItemPos.y);
            }
            this.applyItem(newItemPos.x, newItemPos.y);
        }
    }

    private applyItem(col: number, row: number) {
        if (this.selectedItem === Item.Spawn) {
            this.mapService.decreaseSpawnsToPlace();
        } else if (this.selectedItem === Item.Flag) {
            this.mapService.setHasFlagOnBoard(true);
        } else {
            this.mapService.decreaseItemsToPlace();
        }

        if (this.mapService.getCellItem(col, row) !== Item.Default) {
            this.deleteItem(col, row);
        }
        this.mapService.setCellItem(col, row, this.selectedItem as Item);
    }

    private deleteItem(col: number, row: number) {
        if (this.mapService.getCellItem(col, row) === Item.Spawn) {
            this.mapService.increaseSpawnsToPlace();
        } else if (this.mapService.getCellItem(col, row) === Item.Flag) {
            this.mapService.setHasFlagOnBoard(false);
        } else {
            this.mapService.increaseItemsToPlace();
        }
        this.mapService.setCellItem(col, row, Item.Default);
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
