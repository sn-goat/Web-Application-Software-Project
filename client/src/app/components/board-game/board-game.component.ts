import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnChanges, OnInit, OnDestroy, SimpleChanges, ElementRef } from '@angular/core';
import { BoardCellComponent } from '@app/components/board-cell/board-cell.component';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';
import { ItemType, TileType, BoardStatus, BoardVisibility } from '@common/enums';
import { Subject, takeUntil } from 'rxjs';
import { Board, BoardCell } from '@common/board';
import { Vec2 } from '@common/vec2';

@Component({
    selector: 'app-board-game',
    templateUrl: './board-game.component.html',
    styleUrls: ['./board-game.component.scss'],
    imports: [CommonModule, BoardCellComponent],
})
export class BoardGameComponent implements OnInit, OnChanges, OnDestroy {
    @Input() importedData: { name: string; size: number; description: string } = { name: '', size: 0, description: '' };

    isMouseRightDown: boolean = false;
    isMouseLeftDown: boolean = false;

    previousCoord: Vec2 = { x: -1, y: -1 };
    currentCoord: Vec2 = { x: -1, y: -1 };

    readonly itemMap: Map<ItemType, Vec2[]> = new Map();

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

    private selectedTile: TileType | null = null;
    private destroy$ = new Subject<void>();

    constructor(
        private elRef: ElementRef,
        private editToolMouse: EditToolMouse,
    ) {
        this.itemMap.set(ItemType.Bow, [{ x: -1, y: -1 }]);
        this.itemMap.set(ItemType.Sword, [{ x: -1, y: -1 }]);
        this.itemMap.set(ItemType.Shield, [{ x: -1, y: -1 }]);
        this.itemMap.set(ItemType.Flag, [{ x: -1, y: -1 }]);
        this.itemMap.set(ItemType.Monster_Egg, [{ x: -1, y: -1 }]);
        this.itemMap.set(ItemType.Leather_Boot, [{ x: -1, y: -1 }]);
        this.itemMap.set(ItemType.Sword, [{ x: -1, y: -1 }]);
        this.itemMap.set(ItemType.Pearl, [{ x: -1, y: -1 }]);
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
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        this.currentCoord = { x: event.clientX, y: event.clientY };
        this.applyIntermadiateTiles(this.previousCoord, this.currentCoord);
        this.previousCoord = this.currentCoord;
    }

    ngOnInit() {
        this.editToolMouse.selectedTile$.pipe(takeUntil(this.destroy$)).subscribe((tile) => {
            this.selectedTile = tile;
        });
        this.updateBoardGame();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['importedData']) {
            this.updateBoardGame();
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private generateBoard(size: number) {
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
            _id: this.boardGame._id,
            name: this.importedData.name,
            description: this.importedData.description,
            size: this.importedData.size,
            category: this.boardGame.category,
            isCTF: this.boardGame.isCTF,
            board: this.boardGame.board,
            status: BoardStatus.Ongoing,
            visibility: BoardVisibility.Public,
            image: this.boardGame.image,
            createdAt: this.boardGame.createdAt,
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

    private applyIntermadiateTiles(previousCoord: Vec2, currentCoord: Vec2) {
        const firstCell = this.screenToBoard(previousCoord.x, previousCoord.y);
        const finalCell = this.screenToBoard(currentCoord.x, currentCoord.y);

        const seen: Set<Vec2> = new Set([firstCell, finalCell]);
        const slope = (currentCoord.y - previousCoord.y) / (currentCoord.x - previousCoord.x);
        const step = previousCoord.x < currentCoord.x ? 1 : -1;

        for (let x = previousCoord.x; x < currentCoord.x; x += step) {
            const y: number = slope * (x - previousCoord.x) + previousCoord.y;
            const tileCoord = this.screenToBoard(x, y);
            if (!seen.has(tileCoord)) {
                this.updateCell(tileCoord.x, tileCoord.y);
            }
        }

        this.updateCell(finalCell.x, finalCell.y);
    }

    private applyTile(col: number, row: number) {
        if (this.selectedTile !== null) {
            this.boardGame.board[row][col].tile = this.selectedTile as TileType;
        }
    }

    private revertToDefault(col: number, row: number) {
        this.boardGame.board[row][col].tile = TileType.Default;
    }

    private updateCell(col: number, row: number) {
        if (this.isMouseRightDown) {
            this.revertToDefault(col, row);
        } else if (this.isMouseLeftDown) {
            this.applyTile(col, row);
        }
    }
}
