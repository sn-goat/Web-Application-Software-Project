import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { BoardCellComponent } from '@app/components/board-cell/board-cell.component';
import { MapService } from '@app/services/map.service';
import { TileApplicatorService } from '@app/services/tile-applicator.service';
import { Board } from '@common/board';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-board-game',
    templateUrl: './board-game.component.html',
    styleUrls: ['./board-game.component.scss'],
    imports: [CommonModule, BoardCellComponent],
})
export class BoardGameComponent implements OnInit, OnDestroy {
    boardGame: Board;
    private boardSubscription: Subscription;
    private mapService = inject(MapService);

    constructor(
        public elRef: ElementRef,
        private tileApplicator: TileApplicatorService,
    ) {}

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        this.tileApplicator.handleMouseDown(event, this.elRef.nativeElement.getBoundingClientRect());
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
        this.tileApplicator.handleMouseMove(this.elRef.nativeElement.getBoundingClientRect());
    }

    @HostListener('drop', ['$event'])
    onDrop(event: DragEvent) {
        event.preventDefault();
        this.tileApplicator.handleDrop(this.elRef.nativeElement.getBoundingClientRect());
    }

    @HostListener('dragend', ['$event'])
    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.tileApplicator.setItemOutsideBoard(event.pageX, event.pageY, this.elRef.nativeElement.getBoundingClientRect());
    }

    ngOnInit() {
        this.boardSubscription = this.mapService.getBoardToSave().subscribe((board: Board) => {
            this.boardGame = board;
        });
    }

    ngOnDestroy() {
        if (this.boardSubscription) {
            this.boardSubscription.unsubscribe();
        }
    }
}
