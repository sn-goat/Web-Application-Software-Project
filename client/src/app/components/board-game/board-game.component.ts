import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { BoardCellComponent } from '@app/components/board-cell/board-cell.component';
import { Items, Tiles } from '@app/enum/tile';
import { BoardCell } from '@app/interfaces/board/board-cell';
import { BoardGame } from '@app/interfaces/board/board-game';

@Component({
    selector: 'app-board-game',
    templateUrl: './board-game.component.html',
    styleUrls: ['./board-game.component.scss'],
    imports: [CommonModule, BoardCellComponent],
})
export class BoardGameComponent implements OnInit, OnChanges {
    @Input() importedData: { name: string; size: number; description: string } = { name: '', size: 0, description: '' };
    cellSize: string = '';
    isMouseDown: boolean = false;

    boardGame: BoardGame = {
        _id: '',
        name: '',
        size: 0,
        description: '',
        boardCells: [],
        status: 'Ongoing',
        visibility: 'Public',
    };
    @HostListener('mousedown')
    onMouseDown() {
        this.isMouseDown = true;
    }

    @HostListener('mouseup')
    onMouseUp() {
        this.isMouseDown = false;
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        this.isMouseDown = false;
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
                    tile: Tiles.Default,
                    item: Items.NoItem,
                });
            }
            this.boardGame.boardCells.push(row);
        }
    }

    updateBoardGame() {
        this.boardGame = {
            _id: '',
            name: this.importedData.name,
            size: this.importedData.size,
            description: this.importedData.description,
            boardCells: [],
            status: 'Ongoing',
            visibility: 'Public',
        };

        this.generateBoard(this.boardGame.size);
    }
}
