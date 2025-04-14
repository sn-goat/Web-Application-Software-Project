import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { BoardCellComponent } from '@app/components/common/board-cell/board-cell.component';
import { EditEventHandlerService } from '@app/services/edit-event-handler/edit-event-handler.service';
import { MapService } from '@app/services/map/map.service';
import { Board } from '@common/board';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-board-game',
    templateUrl: './board-game.component.html',
    styleUrls: ['./board-game.component.scss'],
    imports: [CommonModule, BoardCellComponent],
})
export class BoardGameComponent implements OnInit, OnDestroy {
    elRef = inject(ElementRef);

    boardGame: Board;
    private boardSubscription: Subscription;
    private mapService = inject(MapService);
    private editEventHandlerService = inject(EditEventHandlerService);

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
