import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ToolSelectionService } from '@app/services/code/tool-selection.service';
import { MapService } from '@app/services/code/map.service';

import { Item, Tile } from '@common/enums';
import { Vec2 } from '@common/board';

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
        if (this.mapService.getCellItem(cellPosition.x, cellPosition.y) !== Item.DEFAULT) {
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
    setBackToContainer(item: Item = Item.DEFAULT) {
        this.isBackToContainer = item === this.selectedItem;
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
