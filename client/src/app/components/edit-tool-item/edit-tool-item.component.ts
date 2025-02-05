import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ToolSelectionService } from '@app/services/tool-selection.service';
import { ItemType } from '@common/enums';
import { DEFAULT_PATH_ITEMS } from '@app/constants/path';
import { BOARD_SIZE_MAPPING } from '@app/constants/map-size-limitd';

@Component({
    selector: 'app-edit-tool-item',
    templateUrl: './edit-tool-item.component.html',
    styleUrl: './edit-tool-item.component.scss',
    imports: [],
})
export class EditToolItemComponent implements OnInit, OnDestroy {
    @Input() type!: ItemType;
    @Input() boardSize!: number;

    readonly src = DEFAULT_PATH_ITEMS;
    readonly fileType = '.png';
    isDraggable = true;
    remainingItem: number = 0;

    private destroy$ = new Subject<void>();

    constructor(private toolSelection: ToolSelectionService) {}
    ngOnInit() {
        const maxObjectByType = BOARD_SIZE_MAPPING.get(this.boardSize);
        if (this.type === ItemType.Spawn) {
            this.toolSelection.nbrSpawnOnBoard$.pipe(takeUntil(this.destroy$)).subscribe((nbrSpawns) => {
                if (maxObjectByType !== undefined) {
                    this.remainingItem = maxObjectByType - nbrSpawns;
                    this.isDraggable = this.remainingItem > 0;
                }
            });
        } else if (this.type === ItemType.Chest) {
            this.toolSelection.nbrChestOnBoard$.pipe(takeUntil(this.destroy$)).subscribe((nbrChests) => {
                if (maxObjectByType !== undefined) {
                    this.remainingItem = maxObjectByType - nbrChests;
                    this.isDraggable = this.remainingItem > 0;
                }
            });
        } else {
            this.toolSelection.itemOnBoard$.pipe(takeUntil(this.destroy$)).subscribe((items) => {
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
    }
}
