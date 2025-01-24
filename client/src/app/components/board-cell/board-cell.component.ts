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
    @Input() isMouseDown!: boolean;
    @Input() cell!: BoardCell;
    imageUrl: string = './assets/tiles/Wall.png';
    private destroy$ = new Subject<void>();

    constructor(private editToolMouse: EditToolMouse) {}

    @HostListener('mouseover')
    onMouseOver() {
        if (this.isMouseDown) {
            this.updateCell();
        }
    }

    @HostListener('mousedown')
    onMouseDown() {
        this.updateCell();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private updateCell() {
        this.destroy$ = new Subject<void>();
        this.editToolMouse.isTile$.pipe(takeUntil(this.destroy$)).subscribe((isTile: boolean) => {
            if (isTile) {
                this.cell.tile = Tiles.Default;
                this.editToolMouse.itemUrl$.pipe(takeUntil<string>(this.destroy$)).subscribe((url: string) => (this.imageUrl = url));
            } else {
                this.cell.item = Items.NoItem;
            }
        });
        this.destroy$.next();
        this.destroy$.complete();
    }
}
