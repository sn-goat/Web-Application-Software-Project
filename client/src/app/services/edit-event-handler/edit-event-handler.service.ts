import { inject, Injectable } from '@angular/core';
import { ItemApplicatorService } from '@app/services/item-applicator/item-applicator.service';
import { MapService } from '@app/services/map/map.service';
import { TileApplicatorService } from '@app/services/tile-applicator/tile-applicator.service';
import { Vec2 } from '@common/board';
import { Item } from '@common/enums';

@Injectable({
    providedIn: 'root',
})
export class EditEventHandlerService {
    private mapService = inject(MapService);
    private itemApplicatorService = inject(ItemApplicatorService);
    private tileApplicatorService = inject(TileApplicatorService);

    handleMouseDown(event: MouseEvent, rect: DOMRect) {
        const currentCoord = this.screenToBoard(event.pageX, event.pageY, rect);
        if (this.mapService.getCellItem(currentCoord.x, currentCoord.y) !== Item.Default) {
            this.itemApplicatorService.handleMouseDown(event, rect);
        } else {
            this.tileApplicatorService.handleMouseDown(event, rect);
        }
    }

    handleMouseUp(event: MouseEvent) {
        this.itemApplicatorService.handleMouseUp();
        this.tileApplicatorService.handleMouseUp(event);
    }

    handleMouseMove(event: MouseEvent, rect: DOMRect) {
        this.tileApplicatorService.handleMouseMove(rect);
    }

    handleDragEnd(event: DragEvent, rect: DOMRect) {
        this.itemApplicatorService.handleDragEnd(event, rect);
    }

    private screenToBoard(x: number, y: number, rect: DOMRect): Vec2 {
        const coordX = Math.floor(x - rect.left);
        const coordY = Math.floor(y - rect.top);
        const cellWidth = rect.width / this.mapService.getBoardSize();
        const cellHeight = rect.height / this.mapService.getBoardSize();

        const tileX = Math.floor(coordX / cellWidth);
        const tileY = Math.floor(coordY / cellHeight);
        const tileCoord: Vec2 = { x: tileX, y: tileY };
        return tileCoord;
    }
}
