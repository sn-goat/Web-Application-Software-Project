import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_ITEMS } from '@app/constants/path';
import { ItemApplicatorService } from '@app/services/item-applicator/item-applicator.service';
import { MapService } from '@app/services/map/map.service';
import { ToolSelectionService } from '@app/services/tool-selection/tool-selection.service';
import { Board } from '@common/board';
import { Item } from '@common/enums';
import { Subject, combineLatest, takeUntil } from 'rxjs';

@Component({
    selector: 'app-edit-tool-item',
    templateUrl: './edit-tool-item.component.html',
    styleUrls: ['./edit-tool-item.component.scss'],
    imports: [MatBadgeModule, CommonModule],
})
export class EditToolItemComponent implements OnInit, OnDestroy {
    @Input() type: Item;

    readonly src = DEFAULT_PATH_ITEMS;
    readonly fileType = DEFAULT_FILE_TYPE;
    isDraggable = true;
    remainingItem: number = 0;
    showTooltip = false;

    private readonly mapService = inject(MapService);
    private readonly toolSelectionService = inject(ToolSelectionService);
    private readonly itemSelectionService = inject(ItemApplicatorService);
    private destroy$ = new Subject<void>();
    private isItemPlaced = false;

    ngOnInit() {
        if (this.type === Item.SPAWN) {
            this.mapService.nbrSpawnsToPlace$.pipe(takeUntil(this.destroy$)).subscribe((remainingSpawns) => {
                this.remainingItem = remainingSpawns;
                this.isDraggable = this.remainingItem > 0;
            });
        } else if (this.type === Item.FLAG) {
            if (this.mapService.isModeCTF()) {
                this.mapService.hasFlagOnBoard$.pipe(takeUntil(this.destroy$)).subscribe((isFlagPlaced) => {
                    this.isDraggable = !isFlagPlaced;
                });
            } else {
                this.isDraggable = false;
            }
        } else if (this.type === Item.CHEST) {
            this.mapService.nbrItemsToPlace$.pipe(takeUntil(this.destroy$)).subscribe((remainingItems) => {
                this.remainingItem = remainingItems;
                this.isDraggable = this.remainingItem > 0;
            });
        } else {
            combineLatest([this.mapService.nbrItemsToPlace$, this.mapService.getBoardToSave()])
                .pipe(takeUntil(this.destroy$))
                .subscribe(([remainingItems, board]) => {
                    this.isItemPlaced = this.checkIfItemIsOnBoard(board, this.type);
                    this.remainingItem = remainingItems > 0 && !this.isItemPlaced ? 1 : 0;
                    this.isDraggable = remainingItems > 0 && !this.isItemPlaced;
                });
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onDragStart() {
        this.toolSelectionService.updateSelectedItem(this.type);
    }

    onDragEnter(event: MouseEvent) {
        event.preventDefault();
        this.itemSelectionService.setBackToContainer(this.type);
    }
    onDragLeave(event: MouseEvent) {
        event.preventDefault();
        this.itemSelectionService.setBackToContainer();
    }

    getDescription(type: Item): string {
        return ASSETS_DESCRIPTION.get(type) ?? '';
    }

    private checkIfItemIsOnBoard(board: Board, itemType: Item): boolean {
        if (!board?.board) return false;

        for (const row of board.board) {
            for (const cell of row) {
                if (cell.item === itemType) {
                    return true;
                }
            }
        }
        return false;
    }
}
