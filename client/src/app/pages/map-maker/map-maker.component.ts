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
import { firstValueFrom } from 'rxjs';
import { Validation } from '@common/board';

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

    checkNameValid(): boolean {
        return !this.name.trim().length;
    }

    checkIfReadyToSave() {
        const validation: Validation = this.mapService.isReadyToSave();
        if (!validation.isValid) {
            alert(validation.error);
            return;
        }
        if (this.checkNameValid()) {
            alert('Veuillez donner un nom valide à votre carte');
            return;
        }
        if (confirm('Êtes vous certain de vouloir sauvegarder?')) {
            this.saveBoard()
                .then(() => {
                    alert('Partie sauvegardée! Vous allez être redirigé.\n');
                    this.router.navigate(['/admin']).then(() => {
                        this.reset();
                    });
                })
                .catch((error) => {
                    alert('Erreur dans la configuration de la partie.\n' + error);
                });
        }
    }

    confirmReturn() {
        if (confirm('Etes-vous sûr de vouloir quitter cette page?')) {
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
        let response;
        try {
            if (mapData._id) {
                response = await firstValueFrom(this.boardService.updateBoard({ ...mapData, image: '' }));
            } else {
                const mapDataCreation = Object.assign({}, mapData);
                delete mapDataCreation._id;
                response = await firstValueFrom(this.boardService.addBoard({ ...mapDataCreation, image: '' }));
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
}
