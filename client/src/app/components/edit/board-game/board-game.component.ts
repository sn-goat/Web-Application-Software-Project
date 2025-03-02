import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { BoardCellComponent } from '@app/components/edit/board-cell/board-cell.component';
import { MapService } from '@app/services/code/map.service';
import { EditEventHandlerService } from '@app/services/code/edit-event-handler.service';
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
    private editEventHandlerService = inject(EditEventHandlerService);

    constructor(public elRef: ElementRef) {}

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        this.editEventHandlerService.handleMouseDown(event, this.elRef.nativeElement.getBoundingClientRect());
    }

    @HostListener('mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        this.editEventHandlerService.handleMouseUp(event);
    }

    @HostListener('window:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        this.editEventHandlerService.handleMouseMove(event, this.elRef.nativeElement.getBoundingClientRect());
    }

    @HostListener('window:dragend', ['$event'])
    onDragEnd(event: DragEvent) {
        this.editEventHandlerService.handleDragEnd(event, this.elRef.nativeElement.getBoundingClientRect());
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
