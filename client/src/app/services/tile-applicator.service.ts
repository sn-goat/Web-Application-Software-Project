import { Injectable, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { MouseEditorService } from './mouse-editor.service';
import { ToolSelectionService } from './tool-selection.service';

import { Tile, Item } from '@common/enums';
import { Board, Vec2 } from '@common/board';

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

    private selectedTile: Tile | null;
    private selectedItem: Item | null;
    private currentCoord: Vec2 = { x: -1, y: -1 };

    constructor(
        private mouseEditorService: MouseEditorService,
        private toolSelection: ToolSelectionService,
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

    handleMouseDown(event: MouseEvent, boardGame: Board, rect: DOMRect) {
        this.previousCoord = this.currentCoord;
        const cellPosition = this.screenToBoard(this.previousCoord.x, this.previousCoord.y, boardGame, rect);

        if (event.button === 2) {
            this.isMouseRightDown = true;
            if (boardGame.board[cellPosition.y][cellPosition.x].item !== Item.Default) {
                this.handleItem = true;
                this.deleteItem(cellPosition.x, cellPosition.y, boardGame);
            }
        }
        if (event.button === 0) {
            this.isMouseLeftDown = true;
            if (boardGame.board[cellPosition.y][cellPosition.x].item !== Item.Default) {
                this.handleItem = true;
                this.oldItemPos = this.screenToBoard(this.currentCoord.x, this.currentCoord.y, boardGame, rect);
            }
        }

        this.updateCell(cellPosition.x, cellPosition.y, boardGame);
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
        this.isMouseLeftDown = false;
        this.isMouseRightDown = false;
        this.handleItem = false;
        this.previousCoord = { x: -1, y: -1 };
    }

    handleMouseMove(boardGame: Board, rect: DOMRect) {
        if (!this.handleItem) {
            this.applyIntermediateTiles(this.previousCoord, boardGame, rect);
            this.previousCoord = this.currentCoord;
        }
    }

    handleDrop(boardGame: Board, rect: DOMRect) {
        if (this.selectedItem !== Item.Default) {
            this.newItemPos = this.screenToBoard(this.currentCoord.x, this.currentCoord.y, boardGame, rect);
            this.updatePosition(this.oldItemPos, this.newItemPos, boardGame);
        }
        this.oldItemPos = { x: -1, y: -1 };
        this.toolSelection.updateSelectedItem(Item.Default);
        this.isMouseLeftDown = false;
        this.isMouseRightDown = false;
        this.handleItem = false;
    }

    private isOnBoard(x: number, y: number, rect: DOMRect): boolean {
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    private screenToBoard(x: number, y: number, boardGame: Board, rect: DOMRect): Vec2 {
        const coordX = Math.floor(x - rect.left);
        const coordY = Math.floor(y - rect.top);
        const cellWidth = rect.width / boardGame.size;
        const cellHeight = rect.height / boardGame.size;

        const tileX = Math.floor(coordX / cellWidth);
        const tileY = Math.floor(coordY / cellHeight);
        const tileCoord: Vec2 = { x: tileX, y: tileY };
        return tileCoord;
    }

    private applyIntermediateTiles(previousCoord: Vec2, boardGame: Board, rect: DOMRect) {
        const startX = previousCoord.x;
        const startY = previousCoord.y;
        const endX = this.currentCoord.x;
        const endY = this.currentCoord.y;

        const dx = Math.abs(endX - startX);
        const dy = Math.abs(endY - startY);
        const sx = startX < endX ? 1 : -1;
        const sy = startY < endY ? 1 : -1;
        let err = dx - dy;

        const seen: Set<string> = new Set([JSON.stringify(this.screenToBoard(startX, startY, boardGame, rect))]);

        let x = startX;
        let y = startY;

        while (true) {
            if (!this.isOnBoard(x, y, rect)) {
                break;
            }

            const tileCoord = this.screenToBoard(x, y, boardGame, rect);
            const tileCoordKey = JSON.stringify(tileCoord);
            if (!seen.has(tileCoordKey)) {
                this.updateCell(tileCoord.x, tileCoord.y, boardGame);
                seen.add(tileCoordKey);
            }

            if (x === endX && y === endY) {
                break;
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
    }

    private applyTile(col: number, row: number, boardGame: Board) {
        if (this.selectedTile !== null) {
            if (this.selectedTile === Tile.Wall) {
                this.applyWall(col, row, boardGame);
            } else {
                boardGame.board[row][col].tile = this.selectedTile as Tile;
            }
        }
    }

    private applyWall(col: number, row: number, boardGame: Board) {
        if (boardGame.board[row][col].item !== Item.Default) {
            this.deleteItem(col, row, boardGame);
        }
        boardGame.board[row][col].tile = Tile.Wall;
    }

    private revertToDefault(col: number, row: number, boardGame: Board) {
        if (boardGame.board[row][col].tile !== Tile.Default) {
            boardGame.board[row][col].tile = Tile.Default;
        }
    }

    private updateCell(col: number, row: number, boardGame: Board) {
        if (!this.handleItem) {
            if (this.isMouseRightDown) {
                this.revertToDefault(col, row, boardGame);
            } else if (this.isMouseLeftDown) {
                this.applyTile(col, row, boardGame);
            }
        }
    }

    private applyItem(col: number, row: number, boardGame: Board) {
        if (this.selectedItem === Item.Spawn) {
            this.toolSelection.incrementSpawn();
        } else if (this.selectedItem === Item.Chest) {
            this.toolSelection.incrementChest();
        } else {
            this.toolSelection.addItem(this.selectedItem as Item);
        }

        if (boardGame.board[row][col].item !== Item.Default) {
            this.deleteItem(col, row, boardGame);
        }
        boardGame.board[row][col].item = this.selectedItem as Item;
    }
    private deleteItem(col: number, row: number, boardGame: Board) {
        if (boardGame.board[row][col].item === Item.Spawn) {
            this.toolSelection.decrementSpawn();
        } else if (boardGame.board[row][col].item === Item.Chest) {
            this.toolSelection.decrementChest();
        } else {
            this.toolSelection.removeItem(boardGame.board[row][col].item as Item);
        }
        boardGame.board[row][col].item = Item.Default;
    }

    private updatePosition(oldItemPos: Vec2, newItemPos: Vec2, boardGame: Board) {
        if (boardGame.board[newItemPos.y][newItemPos.x].tile !== Tile.Wall) {
            if (oldItemPos.x !== -1 && oldItemPos.y !== -1) {
                this.deleteItem(oldItemPos.x, oldItemPos.y, boardGame);
            }
            this.applyItem(newItemPos.x, newItemPos.y, boardGame);
        }
    }
}
