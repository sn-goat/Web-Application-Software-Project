import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { DEFAULT_PATH_ITEMS } from '@app/constants/path';
import { MapService } from '@app/services/code/map.service';
import { ToolSelectionService } from '@app/services/code/tool-selection.service';
import { ItemApplicatorService } from '@app/services/code/item-applicator.service';
import { Item } from '@common/enums';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-edit-tool-item',
    templateUrl: './edit-tool-item.component.html',
    styleUrls: ['./edit-tool-item.component.scss'],
    standalone: true,
    imports: [MatBadgeModule, CommonModule],
})
export class EditToolItemComponent implements OnInit, OnDestroy {
    @Input() type: Item;

    readonly src = DEFAULT_PATH_ITEMS;
    readonly fileType = '.png';
    isDraggable = true;
    remainingItem: number = 0;
    showTooltip = false;

    private readonly mapService = inject(MapService);
    private destroy$ = new Subject<void>();

    constructor(
        private toolSelection: ToolSelectionService,
        private itemApplicator: ItemApplicatorService,
    ) {}

    ngOnInit() {
        if (this.type === Item.SPAWN) {
            this.mapService.nbrSpawnsToPlace$.pipe(takeUntil(this.destroy$)).subscribe((remainingSpawns) => {
                this.remainingItem = remainingSpawns;
                this.isDraggable = this.remainingItem > 0;
            });
        } else if (this.type === Item.FLAG) {
            if (this.mapService.isModeCTF()) {
                this.mapService.hasFlagOnBoard$.pipe(takeUntil(this.destroy$)).subscribe((hasFlag) => {
                    this.isDraggable = !hasFlag;
                });
            } else {
                this.isDraggable = false;
            }
        } else {
            this.mapService.nbrItemsToPlace$.pipe(takeUntil(this.destroy$)).subscribe((remainingItems) => {
                this.remainingItem = remainingItems;
                this.isDraggable = this.remainingItem > 0;
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
        this.itemApplicator.setBackToContainer(this.type);
    }
    onDragLeave(event: MouseEvent) {
        event.preventDefault();
        this.itemApplicator.setBackToContainer();
    }

    getDescription(type: Item): string {
        return ASSETS_DESCRIPTION.get(type) ?? '';
    }
}
