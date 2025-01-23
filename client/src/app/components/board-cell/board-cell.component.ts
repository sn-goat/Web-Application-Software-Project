import { Component, Input, OnDestroy, HostListener } from '@angular/core';
import { BoardCell } from '@app/interfaces/board/board-cell';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';
import { Tiles, Items } from '@app/enum/tile';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-board-cell',
    templateUrl: './board-cell.component.html',
    styleUrls: ['./board-cell.component.scss'],
    imports: [CommonModule],
})
export class BoardCellComponent implements OnDestroy {
    @Input() cell!: BoardCell;
    imageUrl: string = './assets/tiles/Wall.png';
    private destroy$ = new Subject<void>();
    private isMouseDown = false;

    constructor(private editToolMouse: EditToolMouse) {}

    @HostListener('mousedown')
    onMouseDown() {
        this.isMouseDown = true;
        this.destroy$ = new Subject<void>();

        this.editToolMouse.isTile$.pipe(takeUntil(this.destroy$)).subscribe((isTile: boolean) => {
            if (isTile) {
                this.cell.tile = Tiles.Default;
                this.editToolMouse.itemUrl$.pipe(takeUntil<string>(this.destroy$)).subscribe((url: string) => (this.imageUrl = url));
            } else {
                this.cell.item = Items.NoItem;
            }
        });
        console.log("down")
    }

    @HostListener('mouseup')
    onMouseUp() {
        this.isMouseDown = false;
        this.destroy$.next();
        this.destroy$.complete();
    }

    @HostListener('mousemove', ['$event'])
    onMouseOver(event: MouseEvent) {
        if (this.isMouseDown) {
            this.editToolMouse.isTile$.pipe(takeUntil(this.destroy$)).subscribe((isTile: boolean) => {
                if (isTile) {
                    this.cell.tile = Tiles.Default;
                    this.editToolMouse.itemUrl$.pipe(takeUntil<string>(this.destroy$)).subscribe((url: string) => (this.imageUrl = url));
                } else {
                    this.cell.item = Items.NoItem;
                }
            });
            console.log('Mouse is over the cell while pressed down', event);
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
