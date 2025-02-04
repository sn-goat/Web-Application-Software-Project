import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import { EditDragDrop } from '@app/classes/edit-drag-drop/edit-drag-drop';
import { TileApplicatorService } from '@app/services/tile-applicator.service';
import { BoardCellComponent } from '@app/components/board-cell/board-cell.component';
import { Board, BoardCell } from '@common/board';
import { BoardStatus, BoardVisibility, ItemType, TileType } from '@common/enums';
import { Vec2 } from '@common/vec2';

@Component({
    selector: 'app-board-game',
    templateUrl: './board-game.component.html',
    styleUrls: ['./board-game.component.scss'],
    imports: [CommonModule, BoardCellComponent],
})
export class BoardGameComponent implements OnInit {
    @Input() importedData: { name: string; size: number; description: string } = { name: '', size: 0, description: '' };
    isMouseRightDown: boolean = false;
    isMouseLeftDown: boolean = false;

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

    constructor(
        private elRef: ElementRef,
        private tileApplicator: TileApplicatorService,
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

    @HostListener('mousedown')
    onMouseDown() {
        this.tileApplicator.handleMouseDown(this.boardGame, this.elRef.nativeElement.getBoundingClientRect());
    }

    @HostListener('mouseup')
    onMouseUp() {
        this.tileApplicator.handleMouseUp();
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        this.tileApplicator.handleMouseLeave();
    }

    @HostListener('mousemove')
    onMouseMove() {
        this.tileApplicator.handleMouseMove(this.boardGame, this.elRef.nativeElement.getBoundingClientRect());
    }

    ngOnInit() {
        this.updateBoardGame();
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
}
