import { CommonModule } from '@angular/common';
import { TileApplicatorService } from '@app/services/tile-applicator.service';
import { Component, ElementRef, HostListener, inject, OnInit } from '@angular/core';
import { BoardCellComponent } from '@app/components/board-cell/board-cell.component';
import { MapService } from '@app/services/map.service';
import { Board } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';

@Component({
    selector: 'app-board-game',
    templateUrl: './board-game.component.html',
    styleUrls: ['./board-game.component.scss'],
    imports: [CommonModule, BoardCellComponent],
})
export class BoardGameComponent implements OnInit {
    boardGame: Board;

    private readonly mapService = inject(MapService);

    constructor(
        private elRef: ElementRef,
        private tileApplicator: TileApplicatorService,
    ) {}

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        this.tileApplicator.handleMouseDown(event, this.boardGame, this.elRef.nativeElement.getBoundingClientRect());
    }

    @HostListener('mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        this.tileApplicator.handleMouseUp(event);
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        this.tileApplicator.handleMouseLeave();
    }

    @HostListener('mousemove')
    onMouseMove() {
        this.tileApplicator.handleMouseMove(this.boardGame, this.elRef.nativeElement.getBoundingClientRect());
    }

    @HostListener('drop', ['$event'])
    onDrop(event: DragEvent) {
        event.preventDefault();
        this.tileApplicator.handleDrop(this.boardGame, this.elRef.nativeElement.getBoundingClientRect());
    }

    ngOnInit() {
        this.initializeBoard();
    }

    private initializeBoard() {
        this.boardGame = this.mapService.getMapData().value;
        if (this.boardGame.board === undefined) {
            this.boardGame = {
                _id: '',
                name: this.boardGame.name,
                description: this.boardGame.description,
                size: this.boardGame.size,
                isCTF: false,
                board: [],
                visibility: Visibility.Public,
                image: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            for (let i = 0; i < this.boardGame.size; i++) {
                const row = [];
                for (let j = 0; j < this.boardGame.size; j++) {
                    row.push({ tile: Tile.Default, item: Item.Default, position: { x: j, y: i } });
                }
                this.boardGame.board.push(row);
            }
        }
        this.parseBoard();
        this.populateEmptyCells();
        this.mapService.setMapData(this.boardGame);
    }

    private parseBoard() {
        for (let i = 0; i < this.boardGame.size; i++) {
            for (let j = 0; j < this.boardGame.size; j++) {
                const cell = this.boardGame.board[i][j];
                if (cell.tile === undefined) {
                    cell.tile = Tile.Default;
                }
                if (cell.item === undefined) {
                    cell.item = Item.Default;
                }
                if (cell.position === undefined) {
                    cell.position = { x: j, y: i };
                }
            }
        }
    }

    private populateEmptyCells() {
        if (this.boardGame.board.length === 0) {
            for (let i = 0; i < this.boardGame.size; i++) {
                const row = [];
                for (let j = 0; j < this.boardGame.size; j++) {
                    row.push({ tile: Tile.Default, item: Item.Default, position: { x: j, y: i } });
                }
                this.boardGame.board.push(row);
            }
        }
    }
}
