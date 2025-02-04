import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { BoardGameComponent } from '@app/components/board-game/board-game.component';
import { EditItemAreaComponent } from '@app/components/edit-item-area/edit-item-area.component';
import { MouseEditorService } from '@app/services/mouse-editor.service';

@Component({
    selector: 'app-map-maker',
    imports: [MatSidenavModule, MatGridListModule, MatFormFieldModule, MatIconModule, BoardGameComponent, EditItemAreaComponent],
    templateUrl: './map-maker.component.html',
    styleUrl: './map-maker.component.scss',
})
export class MapMakerComponent implements OnInit {
    data: { name: string; size: number; description: string } = { name: '', size: 10, description: '' };

    constructor(
        private route: ActivatedRoute,
        private mouseEditor: MouseEditorService,
    ) {}

    @HostListener('contextmenu', ['$event'])
    onRightClick(event: MouseEvent) {
        this.mouseEditor.preventRightClick(event);
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        this.mouseEditor.handleMouseDown(event);
    }

    @HostListener('mouseup', ['$event'])
    onMouseUp(event: MouseEvent) {
        this.mouseEditor.handleMouseUp(event);
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        this.mouseEditor.updateCoordinate(event);
    }

    @HostListener('drag', ['$event'])
    onMouseDrag(event: MouseEvent) {
        this.mouseEditor.updateCoordinate(event);
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.data = {
                name: params['name'] || '',
                size: +params['size'] || 0,
                description: params['description'] || '',
            };
        });
    }
}
