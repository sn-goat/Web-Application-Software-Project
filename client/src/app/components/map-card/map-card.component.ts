import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AlertComponent } from '@app/components/common/alert/alert.component';
import { Alert } from '@app/constants/enums';
import {
    DEFAULT_PATH_DELETE,
    DEFAULT_PATH_EDIT,
    DEFAULT_PATH_ITEMS,
    DEFAULT_PATH_NOT_VISIBLE,
    DEFAULT_PATH_TILES,
    DEFAULT_PATH_VISIBLE,
} from '@app/constants/path';
import { Board } from '@common/board';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-map-card',
    templateUrl: './map-card.component.html',
    styleUrls: ['./map-card.component.scss'],
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
    private readonly dialog = inject(MatDialog);

    onEdit(): void {
        this.edit.emit(this.map);
    }

    async onDelete(): Promise<void> {
        if (await this.confirm(`Êtes-vous sûr de vouloir supprimer? "${this.map.name}"?`)) {
            this.delete.emit(this.map);
        }
    }

    toggleMapVisibility(): void {
        this.toggleVisibility.emit(this.map);
    }

    async confirm(message: string): Promise<boolean> {
        return await this.openDialog(message, Alert.CONFIRM);
    }

    private async openDialog(message: string, type: Alert): Promise<boolean> {
        const dialogRef = this.dialog.open(AlertComponent, {
            data: { type, message },
            disableClose: true,
            hasBackdrop: true,
            backdropClass: 'backdrop-block',
            panelClass: 'alert-dialog',
        });
        return firstValueFrom(dialogRef.afterClosed());
    }
}
