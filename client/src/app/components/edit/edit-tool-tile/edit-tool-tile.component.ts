import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { DEFAULT_PATH_TILES } from '@app/constants/path';
import { ToolSelectionService } from '@app/services/code/tool-selection.service';
import { Tile } from '@common/enums';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-edit-tool-tile',
    templateUrl: './edit-tool-tile.component.html',
    styleUrl: './edit-tool-tile.component.scss',
    imports: [CommonModule],
})
export class EditToolTileComponent implements OnInit, OnDestroy {
    @Input() type!: Tile;
    src: string = DEFAULT_PATH_TILES;
    extension: string = '.png';
    showTooltip = false;
    styleClass: string = 'unselected';
    description: string = '';
    private destroy$ = new Subject<void>();

    constructor(private toolSelection: ToolSelectionService) {}

    ngOnInit() {
        this.toolSelection.selectedTile$.pipe(takeUntil(this.destroy$)).subscribe((tile) => {
            this.styleClass = tile === this.type ? 'selected' : 'unselected';
        });
        this.getDescription(this.type);
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onClick() {
        this.toolSelection.updateSelectedTile(this.type);
    }

    getDescription(type: Tile): string {
        return ASSETS_DESCRIPTION.get(type) ?? 'Pas de description';
    }

    shouldShowAbove(type: Tile): boolean {
        return type === Tile.ICE || type === Tile.WATER;
    }
}
