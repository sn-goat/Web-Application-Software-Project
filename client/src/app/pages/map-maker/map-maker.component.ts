import { Component, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BoardGameComponent } from '@app/components/board-game/board-game.component';
import { EditItemAreaComponent } from '@app/components/edit-item-area/edit-item-area.component';
import { MouseEditorService } from '@app/services/mouse-editor.service';
import { MapService } from '@app/services/map.service';

@Component({
    selector: 'app-map-maker',
    imports: [
        MatSidenavModule,
        MatGridListModule,
        MatFormFieldModule,
        MatIconModule,
        MatMenuModule,
        MatButtonModule,
        BoardGameComponent,
        EditItemAreaComponent,
        FormsModule,
    ],
    templateUrl: './map-maker.component.html',
    styleUrls: ['./map-maker.component.scss'],
})
export class MapMakerComponent {
    private readonly mapService = inject(MapService);

    constructor(private mouseEditor: MouseEditorService) {}

    get name() {
        return this.mapService.getMapData().value.name;
    }

    get description() {
        return this.mapService.getMapData().value.description;
    }

    @HostListener('contextmenu', ['$event'])
    onRightClick(event: MouseEvent) {
        this.mouseEditor.preventRightClick(event);
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        this.mouseEditor.updateCoordinate(event);
    }

    @HostListener('drag', ['$event'])
    onMouseDrag(event: MouseEvent) {
        this.mouseEditor.updateCoordinate(event);
    }
}
