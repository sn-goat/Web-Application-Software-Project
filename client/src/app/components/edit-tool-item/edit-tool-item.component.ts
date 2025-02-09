import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { TooltipComponent } from '@app/components/tooltip/tooltip.component';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { BOARD_SIZE_MAPPING } from '@app/constants/map-size-limitd';
import { DEFAULT_PATH_ITEMS } from '@app/constants/path';
import { MapService } from '@app/services/map.service';
import { TileApplicatorService } from '@app/services/tile-applicator.service';
import { ToolSelectionService } from '@app/services/tool-selection.service';
import { Item, Size } from '@common/enums';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-edit-tool-item',
    templateUrl: './edit-tool-item.component.html',
    styleUrls: ['./edit-tool-item.component.scss'],
    standalone: true,
    imports: [TooltipComponent, MatBadgeModule],
})
export class EditToolItemComponent implements OnInit, OnDestroy {
    @Input() type: Item;

    readonly src = DEFAULT_PATH_ITEMS;
    readonly fileType = '.png';
    isDraggable = true;
    remainingItem: number = 1;
    showTooltip = false;

    private readonly mapService = inject(MapService);
    private destroy$ = new Subject<void>();

    constructor(
        private toolSelection: ToolSelectionService,
        private tileApplicator: TileApplicatorService,
    ) {}

    ngOnInit() {
        const boardSize = this.mapService.getBoardToSave().value.size as Size;
        const maxObjectByType = BOARD_SIZE_MAPPING[boardSize];
        if (this.type === Item.SPAWN) {
            this.toolSelection.nbrSpawnOnBoard$.pipe(takeUntil(this.destroy$)).subscribe((nbrSpawns) => {
                if (maxObjectByType !== undefined) {
                    this.remainingItem = maxObjectByType - nbrSpawns;
                    this.isDraggable = this.remainingItem > 0;
                }
            });
        } else if (this.type === Item.CHEST) {
            this.toolSelection.nbrChestOnBoard$.pipe(takeUntil(this.destroy$)).subscribe((nbrChests) => {
                if (maxObjectByType !== undefined) {
                    this.remainingItem = maxObjectByType - nbrChests;
                    this.isDraggable = this.remainingItem > 0;
                }
            });
        } else {
            this.toolSelection.itemOnBoard$.pipe(takeUntil(this.destroy$)).subscribe((items) => {
                this.remainingItem = !items.has(this.type) ? 1 : 0;
                this.isDraggable = !items.has(this.type);
            });
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onDragStart() {
        this.toolSelection.updateSelectedItem(this.type);
    }

    onDragEnter(event: MouseEvent) {
        event.preventDefault();
        this.tileApplicator.setDropOnItem(this.type);
    }

    getDescription(type: Item): string {
        return ASSETS_DESCRIPTION.get(type) ?? '';
    }
}
