import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';
import {ItemType, TileType } from'../../../../../common/enums';
import { BoardCell } from '../../../../../common/board';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EditDragDrop } from '@app/classes/edit-drag-drop/edit-drag-drop';
import { Vec2 } from '@common/vec2';

@Component({
    selector: 'app-board-cell',
    templateUrl: './board-cell.component.html',
    styleUrls: ['./board-cell.component.scss'],
    imports: [CommonModule],
})
export class BoardCellComponent implements OnInit, OnDestroy {
    @Input() isMouseRightDown!: boolean;
    @Input() isMouseLeftDown!: boolean;
    @Input() cell: BoardCell;
    @Input() itemMap: Map<ItemType, Vec2[]>;
    @Input() board: BoardCell[][];

    readonly srcItem = './assets/items/';
    readonly srcTile = './assets/tiles/';
    readonly fileType = '.png';
    readonly baseTileUrl = './assets/tiles/Base.png';
    tileUrl = this.baseTileUrl;
    private selectedTool: string = '';
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
            this.revertToDefault();
        } else if (event.button === 0) {
            this.applyTile();
        }
    }

    ngOnInit() {
        this.editToolMouse.selectedTool$.pipe(takeUntil(this.destroy$)).subscribe((tool) => {
            this.selectedTool = tool;
        });
        this.editToolMouse.isTile$.pipe(takeUntil(this.destroy$)).subscribe((isTile) => {
            this.isTile = isTile;
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.editDragDrop.onDrop(this.board, this.cell, this.itemMap);
    }

    onDragStart(event: DragEvent) {
        event.preventDefault();
        this.editDragDrop.setCurrentItem(this.cell.item);
    }

    private applyTile() {
        if (this.isTile && this.selectedTool !== '') {
            this.cell.tile = this.selectedTool as TileType;
            this.tileUrl = this.srcTile + this.selectedTool + this.fileType;
        }
    }

    private revertToDefault() {
        this.cell.tile = TileType.Default;
        this.tileUrl = this.baseTileUrl;
        this.cell.item = ItemType.Default;
    }

    private updateCell() {
        if (this.isMouseRightDown) {
            this.revertToDefault();
        } else if (this.isMouseLeftDown) {
            this.applyTile();
        }
    }
}
