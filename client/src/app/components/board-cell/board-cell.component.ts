import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';
import { Items, Tiles } from '@app/enum/tile';
import { BoardCell } from '@app/interfaces/board/board-cell';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EditDragDrop } from '@app/classes/edit-drag-drop/edit-drag-drop';

@Component({
    selector: 'app-board-cell',
    templateUrl: './board-cell.component.html',
    styleUrls: ['./board-cell.component.scss'],
    imports: [CommonModule],
})
export class BoardCellComponent implements OnInit, OnDestroy {
    @Input() isMouseRightDown!: boolean;
    @Input() isMouseLeftDown!: boolean;
    @Input() cell!: BoardCell;

    imageUrl: string = './assets/tiles/Wall.png';
    itemUrl: string = '';
    private selectedUrl: string = '';
    private isTile: boolean = false;
    private destroy$ = new Subject<void>();

    constructor(
        private editToolMouse: EditToolMouse,
        private editDragDrop: EditDragDrop,
    ) {}

    @HostListener('mouseover')
    onMouseOver() {
        this.updateCell();
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        if (event.button === 2) {
            this.revertToWall();
        } else if (event.button === 0) {
            this.applyTile();
        }
    }

    ngOnInit() {
        this.editToolMouse.selectedUrl$.pipe(takeUntil(this.destroy$)).subscribe(url => {
            this.selectedUrl = url;
        });
        this.editToolMouse.isTile$.pipe(takeUntil(this.destroy$)).subscribe(isTile => {
            this.isTile = isTile;
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        this.itemUrl = '';
    }

    onDrop(event: DragEvent) {
        const startItemName = 24;
        const endItemName = 4;
        event.preventDefault();
        const image = event.dataTransfer ? event.dataTransfer.getData('text/plain') : '';
        if (image) {
            this.editDragDrop.addWasDragged(image.substring(startItemName, image.length - endItemName));
        }
        this.itemUrl = image;
    }

    onDragStart(event: DragEvent) {
        event.dataTransfer?.setData('text/plain', this.itemUrl);
    }

    private applyTile() {
        if (this.isTile && this.selectedUrl !== '') {
            this.cell.tile = Tiles.Default;
            this.imageUrl = this.selectedUrl;
        }
    }

    private revertToWall() {
        this.cell.tile = Tiles.Default;
        this.imageUrl = './assets/tiles/Wall.png';
        this.cell.item = Items.NoItem;
    }

    private updateCell() {
        if (this.isMouseRightDown) {
            this.revertToWall();
        } else if (this.isMouseLeftDown) {
            this.applyTile();
        }
    }
}
