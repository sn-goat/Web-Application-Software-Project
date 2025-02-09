import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { BOARD_SIZE_MAPPING } from '@app/constants/map-size-limitd';
import { DEFAULT_PATH_ITEMS } from '@app/constants/path';
import { MapService } from '@app/services/map.service';
import { ToolSelectionService } from '@app/services/tool-selection.service';
import { Size, Item } from '@common/enums';
import { Subject, takeUntil } from 'rxjs';
import { TileApplicatorService } from '@app/services/tile-applicator.service';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
    selector: 'app-edit-tool-item',
    templateUrl: './edit-tool-item.component.html',
    styleUrls: ['./edit-tool-item.component.scss'],
    standalone: true,
    imports: [MatBadgeModule],
})
export class EditToolItemComponent implements OnInit, OnDestroy {
    @Input() type: Item;

    readonly src = DEFAULT_PATH_ITEMS;
    readonly fileType = '.png';
    isDraggable = true;
    remainingItem: number = 1;
    showTooltip = false;

    private maxObjectByType: number;
    private boardSize: Size;
    private readonly mapService = inject(MapService);
    private destroy$ = new Subject<void>();

    constructor(
        private toolSelection: ToolSelectionService,
        private tileApplicator: TileApplicatorService,
    ) {}

    ngOnInit() {
        this.boardSize = this.mapService.getMapData().value.size as Size;
        this.maxObjectByType = BOARD_SIZE_MAPPING[this.boardSize];
        if (this.type === Item.SPAWN) {
            this.toolSelection.nbrSpawnOnBoard$.pipe(takeUntil(this.destroy$)).subscribe((nbrSpawns) => {
                if (this.maxObjectByType !== undefined) {
                    this.remainingItem = this.maxObjectByType - nbrSpawns;
                    this.isDraggable = this.remainingItem > 0;
                    this.toolSelection.setIsReadyToSave(this.remainingItem === 0);
                }
            });
        } else if (this.type === Item.CHEST) {
            this.toolSelection.nbrChestOnBoard$.pipe(takeUntil(this.destroy$)).subscribe((nbrChests) => {
                if (this.maxObjectByType !== undefined) {
                    this.remainingItem = this.maxObjectByType - nbrChests;
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
        if (this.type === Item.SPAWN || this.type === Item.CHEST) {
            this.remainingItem = BOARD_SIZE_MAPPING[this.boardSize];
        } else {
            this.remainingItem = 1;
        }
    }

    onDragStart() {
        this.toolSelection.updateSelectedItem(this.type);
        this.tileApplicator.setDropOnItem(Item.DEFAULT);
    }

    onDragEnter(event: MouseEvent) {
        event.preventDefault();
        this.tileApplicator.setDropOnItem(this.type);
    }

    getDescription(type: Item): string {
        return ASSETS_DESCRIPTION.get(type) ?? '';
    }
}
