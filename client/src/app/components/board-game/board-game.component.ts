import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, EventEmitter, ElementRef } from '@angular/core';
import { BoardCellComponent } from '@app/components/board-cell/board-cell.component';
import { ItemType, TileType, BoardStatus, BoardVisibility } from '@common/enums';
import { Board, BoardCell } from '@common/board';
import { Vec2 } from '@common/vec2';

@Component({
    selector: 'app-board-game',
    templateUrl: './board-game.component.html',
    styleUrls: ['./board-game.component.scss'],
    imports: [CommonModule, BoardCellComponent],
})
export class BoardGameComponent implements OnInit, OnChanges {
    @Input() importedData: { name: string; size: number; description: string } = { name: '', size: 0, description: '' };
    @Output() tilesCoord = new EventEmitter<{ x: number; y: number }>();
    isMouseRightDown: boolean = false;
    isMouseLeftDown: boolean = false;

    readonly itemMap: Map<ItemType, Vec2[]> = new Map();

    readonly celleSize = 540;
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

    constructor(private elRef: ElementRef) {
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
    }

    @HostListener('mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        if (event.button === 0) {
            this.isMouseLeftDown = false;
        }
        if (event.button === 2) {
            this.isMouseRightDown = false;
        }
    }
    @HostListener('mouseleave')
    onMouseLeave() {
        this.isMouseLeftDown = false;
        this.isMouseRightDown = false;
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        const rect = this.elRef.nativeElement.getBoundingClientRect();
        const x = Math.floor(event.clientX - rect.left);
        const y = Math.floor(event.clientY - rect.top);
        this.tilesCoord.emit(this.getCellMouseOver({ x, y }));
    }

    ngOnInit() {
        this.updateBoardGame();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['importedData']) {
            this.updateBoardGame();
        }
    }

    generateBoard(size: number) {
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

    updateBoardGame() {
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

    getCellMouseOver(coord: { x: number; y: number }) {
        const cellSize = this.celleSize / this.boardGame.size;
        const tileX = Math.floor(coord.x / cellSize);
        const tileY = Math.floor(coord.y / cellSize);
        const tileCoord = { x: tileX, y: tileY };
        return tileCoord;
    }
}
