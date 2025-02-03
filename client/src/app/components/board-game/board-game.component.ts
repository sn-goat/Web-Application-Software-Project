import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { EditDragDrop } from '@app/classes/edit-drag-drop/edit-drag-drop';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';
import { BoardCellComponent } from '@app/components/board-cell/board-cell.component';
import { Board, BoardCell } from '@common/board';
import { BoardStatus, BoardVisibility, ItemType, TileType } from '@common/enums';
import { Vec2 } from '@common/vec2';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-board-game',
    templateUrl: './board-game.component.html',
    styleUrls: ['./board-game.component.scss'],
    imports: [CommonModule, BoardCellComponent],
})
export class BoardGameComponent implements OnInit, OnDestroy {
    @Input() importedData: { name: string; size: number; description: string } = { name: '', size: 0, description: '' };

    isMouseRightDown: boolean = false;
    isMouseLeftDown: boolean = false;

    previousCoord: Vec2 = { x: -1, y: -1 };
    currentCoord: Vec2 = { x: -1, y: -1 };

    boardGame: Board = {
        _id: '',
        name: '',
        description: '',
        size: 15,
        category: '',
        isCTF: false,
        board: [],
        status: BoardStatus.Ongoing,
        visibility: BoardVisibility.Public,
        image: '',
        createdAt: new Date().getDate().toString(),
        updatedAt: '',
    };

    itemMap: Map<ItemType, Vec2[]> = new Map();

    private selectedTile: TileType | null = null;
    private destroy$ = new Subject<void>();

    constructor(
        private elRef: ElementRef,
        private editToolMouse: EditToolMouse,
        private editDragDrop: EditDragDrop,
    ) {
        this.itemMap.set(ItemType.Bow, [{ x: -1, y: -1 }]);
        this.itemMap.set(ItemType.Sword, [{ x: -1, y: -1 }]);
        this.itemMap.set(ItemType.Shield, [{ x: -1, y: -1 }]);
        this.itemMap.set(ItemType.Flag, [{ x: -1, y: -1 }]);
        this.itemMap.set(ItemType.Monster_Egg, [{ x: -1, y: -1 }]);
        this.itemMap.set(ItemType.Leather_Boot, [{ x: -1, y: -1 }]);
        this.itemMap.set(ItemType.Sword, [{ x: -1, y: -1 }]);
        this.itemMap.set(ItemType.Pearl, [{ x: -1, y: -1 }]);
        this.editDragDrop.isOnItemContainer$.subscribe((isOnItemContainer) => {
            if (isOnItemContainer) {
                this.editDragDrop.onDragLeave(this.boardGame.board, this.itemMap);
            }
        });
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        if (event.button === 2) {
            this.isMouseRightDown = true;
        } else if (event.button === 0) {
            this.isMouseLeftDown = true;
        }
        this.previousCoord = { x: event.clientX, y: event.clientY };
        const cellPosition = this.screenToBoard(this.previousCoord.x, this.previousCoord.y);
        this.updateCell(cellPosition.x, cellPosition.y);
    }

    @HostListener('contextmenu', ['$event'])
    onRightClick(event: MouseEvent) {
        event.preventDefault();
    }

    @HostListener('mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        if (event.button === 0) {
            this.isMouseLeftDown = false;
        }
        if (event.button === 2) {
            this.isMouseRightDown = false;
        }
        this.previousCoord = { x: -1, y: -1 };
        this.currentCoord = { x: -1, y: -1 };
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        this.isMouseLeftDown = false;
        this.isMouseRightDown = false;
        this.previousCoord = { x: -1, y: -1 };
        this.currentCoord = { x: -1, y: -1 };

        this.editDragDrop.setCurrentPosition({ x: -1, y: -1 });
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        this.currentCoord = { x: event.clientX, y: event.clientY };
        this.applyIntermediateTiles(this.previousCoord, this.currentCoord);
        this.previousCoord = this.currentCoord;

        this.editDragDrop.setCurrentPosition({ x: event.clientX, y: event.clientY });
    }

    ngOnInit() {
        this.editToolMouse.selectedTile$.pipe(takeUntil(this.destroy$)).subscribe((tile) => {
            this.selectedTile = tile;
        });
        this.updateBoardGame();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private generateBoard(size: number) {
        this.boardGame.board = [];
        for (let i = 0; i < size; i++) {
            const row: BoardCell[] = [];
            for (let j = 0; j < size; j++) {
                row.push({
                    position: { x: i, y: j },
                    tile: TileType.Default,
                    item: ItemType.Default,
                });
            }
            this.boardGame.board.push(row);
        }
    }

    private updateBoardGame() {
        this.boardGame = {
            ...this.boardGame,
            name: this.importedData.name,
            description: this.importedData.description,
            size: this.importedData.size,
            status: BoardStatus.Ongoing,
            visibility: BoardVisibility.Public,
            updatedAt: new Date().getDate().toString(),
        };

        this.generateBoard(this.boardGame.size);
    }

    private screenToBoard(x: number, y: number): Vec2 {
        const rect = this.elRef.nativeElement.getBoundingClientRect();
        const coordX = Math.floor(x - rect.left);
        const coordY = Math.floor(y - rect.top);
        const cellWidth = rect.width / this.boardGame.size;
        const cellHeight = rect.height / this.boardGame.size;

        const tileX = Math.floor(coordX / cellWidth);
        const tileY = Math.floor(coordY / cellHeight);
        const tileCoord: Vec2 = { x: tileX, y: tileY };
        return tileCoord;
    }

    private applyIntermediateTiles(previousCoord: Vec2, currentCoord: Vec2) {
        const firstCell = this.screenToBoard(previousCoord.x, previousCoord.y);
        const finalCell = this.screenToBoard(currentCoord.x, currentCoord.y);

        const seen: Set<Vec2> = new Set([firstCell, finalCell]);
        const slope = (currentCoord.y - previousCoord.y) / (currentCoord.x - previousCoord.x);
        const step = previousCoord.x < currentCoord.x ? 1 : -1;

        for (let x = previousCoord.x; x < currentCoord.x; x += step) {
            const y: number = slope * (x - previousCoord.x) + previousCoord.y;
            const tileCoord = this.screenToBoard(x, y);
            if (tileCoord.x === finalCell.x && tileCoord.y === finalCell.y) {
                break;
            } else if (!seen.has(tileCoord)) {
                this.updateCell(tileCoord.x, tileCoord.y);
            }
        }

        this.updateCell(finalCell.x, finalCell.y);
    }

    private applyTile(col: number, row: number) {
        if (this.selectedTile !== null) {
            switch (this.selectedTile) {
                case TileType.Closed_Door:
                    this.applyDoor(col, row);
                    break;

                case TileType.Wall:
                    this.applyWall(col, row);
                    break;

                default:
                    this.boardGame.board[row][col].tile = this.selectedTile as TileType;
                    break;
            }
        }
    }

    private applyDoor(col: number, row: number) {
        if (this.surroudningTilesAreWall(col, row)) {
            if (this.boardGame.board[row][col].tile === TileType.Closed_Door) {
                this.boardGame.board[row][col].tile = TileType.Opened_Door;
            } else if (this.boardGame.board[row][col].tile === TileType.Opened_Door) {
                this.boardGame.board[row][col].tile = TileType.Closed_Door;
            } else {
                this.boardGame.board[row][col].tile = TileType.Closed_Door;
            }
            this.editDragDrop.handleItemOnInvalidTile(this.boardGame.board[row][col], this.itemMap, this.boardGame.board);
        }
    }

    private applyWall(col: number, row: number) {
        if (this.boardGame.board[row][col].item !== ItemType.Default) {
            this.editDragDrop.handleItemOnInvalidTile(this.boardGame.board[row][col], this.itemMap, this.boardGame.board);
        }
        this.boardGame.board[row][col].tile = TileType.Wall;
    }

    private surroudningTilesAreWall(col: number, row: number): boolean {
        const onXAxis = this.boardGame.board[row][col - 1].tile === TileType.Wall && this.boardGame.board[row][col + 1].tile === TileType.Wall;
        const onYAxis = this.boardGame.board[row - 1][col].tile === TileType.Wall && this.boardGame.board[row + 1][col].tile === TileType.Wall;
        return (onXAxis || onYAxis) && !(onXAxis && onYAxis);
    }
    private revertToDefault(col: number, row: number) {
        if (this.boardGame.board[row][col].item !== ItemType.Default) {
            this.editDragDrop.handleItemOnInvalidTile(this.boardGame.board[row][col], this.itemMap, this.boardGame.board);
        } else if (this.boardGame.board[row][col].tile !== TileType.Default) {
            this.boardGame.board[row][col].tile = TileType.Default;
        }
    }

    private updateCell(col: number, row: number) {
        if (this.isMouseRightDown) {
            this.revertToDefault(col, row);
        } else if (this.isMouseLeftDown) {
            this.applyTile(col, row);
        }
    }
}
