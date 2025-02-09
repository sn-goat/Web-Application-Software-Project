import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit } from '@angular/core';
import { BoardCellComponent } from '@app/components/board-cell/board-cell.component';
import { MapService } from '@app/services/map.service';
import { TileApplicatorService } from '@app/services/tile-applicator.service';
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

    @HostListener('window:mousemove')
    onMouseMove() {
        this.tileApplicator.handleMouseMove(this.boardGame, this.elRef.nativeElement.getBoundingClientRect());
    }

    @HostListener('drop', ['$event'])
    onDrop(event: DragEvent) {
        event.preventDefault();
        this.tileApplicator.handleDrop(this.boardGame, this.elRef.nativeElement.getBoundingClientRect());
    }

    @HostListener('dragend', ['$event'])
    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.tileApplicator.setItemOutsideBoard(this.boardGame, event.pageX, event.pageY, this.elRef.nativeElement.getBoundingClientRect());
    }

    ngOnInit() {
        this.mapService.initializeBoard();
        this.mapService.getBoardToSave().subscribe((board: Board) => {
            this.boardGame = board;
        });
    }
}
