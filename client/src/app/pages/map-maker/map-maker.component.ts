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
import { ScreenshotService } from '@app/services/code/screenshot.service';
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
        private screenshotService: ScreenshotService,
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
                if (confirm('Êtes vous certain de vouloir sauvegarder?')) {
                    this.saveBoard()
                        .then((response) => {
                            alert('Partie sauvegardée! Vous allez être redirigé.\n' + response);
                            this.router.navigate(['/admin']).then(() => {
                                this.reset();
                            });
                        })
                        .catch((error) => {
                            alert('Erreur dans la configuration de la partie.\n' + error.message);
                        });
                }
            } else {
                alert('Vous devez placer au moins ' + this.toolSelection.getMaxObjectByType() + ' items sur la partie.');
                return;
            }
        } else {
            alert('Vous devez placer tous les points de départs du jeu.');
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
        const mapData = this.mapService.getBoardToSave().value;
        const thumbnail = await this.screenshot();
        let response;
        try {
            if (mapData._id) {
                response = await firstValueFrom(this.boardService.updateBoard({ ...mapData, image: thumbnail }));
            } else {
                const mapDataCreation = Object.assign({}, mapData);
                delete mapDataCreation._id;
                response = await firstValueFrom(this.boardService.addBoard({ ...mapDataCreation, image: thumbnail }));
            }
            return response.body as string;
        } catch (error) {
            let errorMessage = 'An unknown error occurred';

            if (typeof error === 'object' && error !== null && 'error' in error) {
                const errorObj = error as { error: { message?: string } };
                errorMessage = errorObj.error?.message || errorMessage;
            }

            return Promise.reject(errorMessage);
        }
    }

    async screenshot(): Promise<string> {
        try {
            return await this.screenshotService.captureElementAsString('map-screenshot');
        } catch (error) {
            return Promise.reject(`Error while screenshot: ${error}`);
        }
    }
}
