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
    imports: [],
})
export class EditToolTileComponent implements OnInit, OnDestroy {
    @Input() type!: Tile;
    src: string = DEFAULT_PATH_TILES;
    extension: string = '.png';
    description: string = '';
    showTooltip = false;
    styleClass: string = 'unselected';
    private destroy$ = new Subject<void>();

    constructor(private toolSelection: ToolSelectionService) {}

    ngOnInit() {
        this.toolSelection.selectedTile$.pipe(takeUntil(this.destroy$)).subscribe((tile) => {
            if (tile === this.type) {
                this.styleClass = 'selected';
            } else {
                this.styleClass = 'unselected';
            }
        });
        this.description = ASSETS_DESCRIPTION.get(this.type) || 'Pas de description';
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onClick() {
        this.toolSelection.updateSelectedTile(this.type);
    }
    getDescription(type: Tile): string {
        return ASSETS_DESCRIPTION.get(type) ?? '';
    }
}
