import { Injectable, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { MouseEditorService } from '@app/services/mouse-editor.service';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';

import { TileType, ItemType } from '@common/enums';
import { Vec2 } from '@common/vec2';
import { Board } from '@common/board';

@Injectable({
    providedIn: 'root',
})
export class TileApplicatorService implements OnDestroy {
    private selectedTile: TileType | null;
    private previousCoord: Vec2 = { x: -1, y: -1 };
    private currentCoord: Vec2 = { x: -1, y: -1 };
    private applyOnBoard: boolean = false;
    private isMouseLeftDown: boolean = false;
    private isMouseRightDown: boolean = false;
    private destroy$ = new Subject<void>();

    constructor(
        private mouseEditorService: MouseEditorService,
        private editToolMouse: EditToolMouse,
    ) {
        this.mouseEditorService.currentCoord$.pipe(takeUntil(this.destroy$)).subscribe((coord) => {
            this.currentCoord = coord;
        });
        this.mouseEditorService.isMouseLeftDown$.pipe(takeUntil(this.destroy$)).subscribe((leftButton) => {
            this.isMouseLeftDown = leftButton;
        });
        this.mouseEditorService.isMouseRightDown$.pipe(takeUntil(this.destroy$)).subscribe((rightButton) => {
            this.isMouseRightDown = rightButton;
        });
        this.editToolMouse.selectedTile$.pipe(takeUntil(this.destroy$)).subscribe((tile) => {
            this.selectedTile = tile;
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    handleMouseDown(boardGame: Board, rect: DOMRect) {
        this.applyOnBoard = true;
        this.previousCoord = this.currentCoord;
        const cellPosition = this.screenToBoard(this.previousCoord.x, this.previousCoord.y, boardGame, rect);
        this.updateCell(cellPosition.x, cellPosition.y, boardGame);
    }

    handleMouseUp() {
        this.previousCoord = { x: -1, y: -1 };
    }

    handleMouseLeave() {
        this.applyOnBoard = false;
        this.mouseEditorService.turnButtonsOff();
        this.previousCoord = { x: -1, y: -1 };
    }

    handleMouseMove(boardGame: Board, rect: DOMRect) {
        if (this.applyOnBoard) {
            this.applyIntermediateTiles(this.previousCoord, boardGame, rect);
            this.previousCoord = this.currentCoord;
        }
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
        const dx = this.currentCoord.x - previousCoord.x;
        const dy = this.currentCoord.y - previousCoord.y;
        const distanceToDo = Math.sqrt(dx * dx + dy * dy);
        let distanceMade = 0;

        const seen: Set<Vec2> = new Set([this.screenToBoard(previousCoord.x, previousCoord.y, boardGame, rect)]);
        const slope = (this.currentCoord.y - previousCoord.y) / (this.currentCoord.x - previousCoord.x);
        const step = previousCoord.x < this.currentCoord.x ? 1 : -1;

        let x = previousCoord.x;
        let y = previousCoord.y;

        while (distanceMade <= distanceToDo) {
            if (!this.isOnBoard(x, y, rect)) {
                break;
            }

            const tileCoord = this.screenToBoard(x, y, boardGame, rect);
            if (!seen.has(tileCoord)) {
                this.updateCell(tileCoord.x, tileCoord.y, boardGame);
                seen.add(tileCoord);
            }
            x += step;
            y = slope * (x - previousCoord.x) + previousCoord.y;
            distanceMade++;
        }
    }

    private applyTile(col: number, row: number, boardGame: Board) {
        if (this.selectedTile !== null) {
            if (this.selectedTile === TileType.Wall) {
                this.applyWall(col, row, boardGame);
            } else {
                boardGame.board[row][col].tile = this.selectedTile as TileType;
            }
        }
    }

    private applyWall(col: number, row: number, boardGame: Board) {
        if (boardGame.board[row][col].item !== ItemType.Default) {
            // this.editDragDrop.handleItemOnInvalidTile(boardGame.board[row][col], this.itemMap, this.boardGame.board);
        }
        boardGame.board[row][col].tile = TileType.Wall;
    }

    private revertToDefault(col: number, row: number, boardGame: Board) {
        if (boardGame.board[row][col].item !== ItemType.Default) {
            // this.editDragDrop.handleItemOnInvalidTile(boardGame.board[row][col], this.itemMap, this.boardGame.board);
        } else if (boardGame.board[row][col].tile !== TileType.Default) {
            boardGame.board[row][col].tile = TileType.Default;
        }
    }

    private updateCell(col: number, row: number, boardGame: Board) {
        if (this.isMouseRightDown) {
            this.revertToDefault(col, row, boardGame);
        } else if (this.isMouseLeftDown) {
            this.applyTile(col, row, boardGame);
        }
    }
}
