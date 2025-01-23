import { Component } from '@angular/core';
import { BoardCellComponent } from '@app/components/board-cell/board-cell.component';
import { BoardGame } from '@app/interfaces/board/board-game';
import { BoardCell } from '@app/interfaces/board/board-cell';
import { CommonModule } from '@angular/common';
import { Tiles, Items } from '@app/enum/tile';

@Component({
    selector: 'app-board-game',
    templateUrl: './board-game.component.html',
    styleUrls: ['./board-game.component.scss'],
    imports: [CommonModule, BoardCellComponent],
})
export class BoardGameComponent {
    readonly defaultSize: number = 20;
    cellSize: string = '';

    boardGame: BoardGame = {
        _id: '',
        name: '',
        size: this.defaultSize,
        description: '',
        boardCells: [],
        status: 'Ongoing',
        visibility: 'Public',
    };
    constructor() {
        this.generateBoard(this.defaultSize);
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
}
