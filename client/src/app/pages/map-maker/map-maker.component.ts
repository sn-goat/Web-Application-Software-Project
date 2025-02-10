import { Component, HostListener, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { BoardGameComponent } from '@app/components/edit/board-game/board-game.component';
import { EditItemAreaComponent } from '@app/components/edit/edit-item-area/edit-item-area.component';
import { BoardService } from '@app/services/code/board.service';
import { MapService } from '@app/services/code/map.service';
import { MouseEditorService } from '@app/services/code/mouse-editor.service';
import { ToolSelectionService } from '@app/services/code/tool-selection.service';
import { firstValueFrom } from 'rxjs';

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
export class MapMakerComponent implements OnInit {
    private readonly mapService = inject(MapService);

    constructor(
        private mouseEditor: MouseEditorService,
        private toolSelection: ToolSelectionService,
        private boardService: BoardService,
        private readonly router: Router,
    ) {}

    get name() {
        return this.mapService.getBoardToSave().value.name;
    }
    get description() {
        return this.mapService.getBoardToSave().value.description;
    }

    set name(value: string) {
        this.mapService.setBoardName(value);
    }
    set description(value: string) {
        this.mapService.setBoardDescription(value);
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

    checkIfReadyToSave() {
        if (this.toolSelection.getIsSpawnPlaced()) {
            if (this.toolSelection.isMinimumObjectPlaced()) {
                if (confirm('Are you sure you want to save the map?')) {
                    this.saveBoard()
                        .then((response) => {
                            alert('Map saved successfully!\n' + response);
                            this.router.navigate(['/admin']).then(() => {
                                this.reset();
                            });
                        })
                        .catch((error) => {
                            alert('An error occurred while saving the map.\n' + error.message);
                        });
                }
            } else {
                alert('You need to place at least ' + this.toolSelection.getMaxObjectByType() + ' item on the map.');
                return;
            }
        } else {
            alert('You need to place all the spawns points on the board before saving the map.');
            return;
        }
    }

    confirmReturn() {
        if (confirm('Are you sure you want to leave this page?')) {
            this.router.navigate(['/admin']).then(() => {
                this.reset();
            });
        }
    }

    reset() {
        window.location.reload();
    }

    ngOnInit() {
        this.mapService.setBoardToFirstValue();
    }

    async saveBoard(): Promise<string> {
        const response = await firstValueFrom(this.boardService.addBoard(this.mapService.getBoardToSave().value));
        return response.body as string;
    }
}
