import { Injectable, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { MouseEditorService } from '@app/services/mouse-editor.service';
import { EditToolMouse } from '@app/classes/edit-tool-mouse/edit-tool-mouse';

import { TileType, ItemType } from '@common/enums';
import { Vec2 } from '@common/vec2';
import { Board } from '@common/board';

@Injectable({
    providedIn: 'root',
})
export class ItemApplicatorService implements OnDestroy{
    private destroy$ = new Subject<void>();
    private previousCoord: Vec2 = { x: -1, y: -1 };
    private selectedItem: ItemType | null;
    private currentCoord: Vec2 = { x: -1, y: -1 };

    constructor(
        private mouseEditorService: MouseEditorService,
        private editToolMouse: EditToolMouse,
    ) {
        this.mouseEditorService.currentCoord$.pipe(takeUntil(this.destroy$)).subscribe((coord) => {
            this.currentCoord = coord;
        });

        this.editToolMouse.selectedItem$.pipe(takeUntil(this.destroy$)).subscribe((item) => {
            this.selectedItem = item;
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    handleDrop(){
        
    }
    handleDragStart(){}


    handleDragLeave(){}
}
