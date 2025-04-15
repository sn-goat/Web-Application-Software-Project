import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { SubLifecycleHandlerComponent } from '@app/components/common/sub-lifecycle-handler/subscription-lifecycle-handler.component';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { DEFAULT_PATH_TILES } from '@app/constants/path';
import { ToolSelectionService } from '@app/services/tool-selection/tool-selection.service';
import { Tile } from '@common/enums';

@Component({
    selector: 'app-edit-tool-tile',
    templateUrl: './edit-tool-tile.component.html',
    styleUrl: './edit-tool-tile.component.scss',
    imports: [CommonModule],
})
export class EditToolTileComponent extends SubLifecycleHandlerComponent implements OnInit {
    @Input() type!: Tile;
    src: string = DEFAULT_PATH_TILES;
    extension: string = '.png';
    showTooltip = false;
    styleClass: string = 'unselected';
    description: string = '';
    private readonly toolSelectionService: ToolSelectionService = inject(ToolSelectionService);

    ngOnInit() {
        this.autoSubscribe(this.toolSelectionService.selectedTile$, (tile) => {
            this.styleClass = tile === this.type ? 'selected' : 'unselected';
        });
        this.getDescription(this.type);
    }

    onClick() {
        this.toolSelectionService.updateSelectedTile(this.type);
    }

    getDescription(type: Tile): string {
        return ASSETS_DESCRIPTION.get(type) ?? 'Pas de description';
    }

    shouldShowAbove(type: Tile): boolean {
        return type === Tile.Ice || type === Tile.Water;
    }
}
