import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Board } from '@common/board';
import {
    DEFAULT_PATH_ITEMS,
    DEFAULT_PATH_TILES,
    DEFAULT_PATH_DELETE,
    DEFAULT_PATH_EDIT,
    DEFAULT_PATH_VISIBLE,
    DEFAULT_PATH_NOT_VISIBLE,
} from '@app/constants/path';

@Component({
    selector: 'app-map-card',
    templateUrl: './map-card.component.html',
    styleUrls: ['./map-card.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class MapCardComponent {
    @Input() map!: Board;
    @Input() isCreationPage: boolean = false;
    @Output() edit = new EventEmitter<Board>();
    @Output() delete = new EventEmitter<Board>();
    @Output() toggleVisibility = new EventEmitter<Board>();

    readonly srcTiles = DEFAULT_PATH_TILES;
    readonly srcItem = DEFAULT_PATH_ITEMS;
    readonly srcEdit = DEFAULT_PATH_EDIT;
    readonly srcDelete = DEFAULT_PATH_DELETE;
    readonly srcVisible = DEFAULT_PATH_VISIBLE;
    readonly srcNotVisible = DEFAULT_PATH_NOT_VISIBLE;
    readonly fileType = '.png';

    // constructor(
    //     // private readonly boardService: BoardService,
    //     // private readonly mapService: MapService,
    // ) {}

    onEdit(): void {
        this.edit.emit(this.map);
    }

    onDelete(): void {
        if (confirm(`Are you sure you want to delete "${this.map.name}"?`)) {
            this.delete.emit(this.map);
        }
    }

    toggleMapVisibility(): void {
        this.toggleVisibility.emit(this.map);
    }
}
