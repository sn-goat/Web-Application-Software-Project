import { Component, HostListener, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { AlertComponent } from '@app/components/common/alert/alert.component';
import { BoardGameComponent } from '@app/components/edit/board-game/board-game.component';
import { EditItemAreaComponent } from '@app/components/edit/edit-item-area/edit-item-area.component';
import { Alert } from '@app/constants/enums';
import { BoardService } from '@app/services/board/board.service';
import { MapService } from '@app/services/map/map.service';
import { MouseEditorService } from '@app/services/mouse-editor/mouse-editor.service';
import { Validation } from '@common/board';
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
    private readonly dialog = inject(MatDialog);
    private readonly router: Router = inject(Router);
    private readonly mouseEditor: MouseEditorService = inject(MouseEditorService);
    private readonly boardService: BoardService = inject(BoardService);

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

    @HostListener('window:contextmenu', ['$event'])
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

    async checkIfReadyToSave() {
        const validation: Validation = this.mapService.isReadyToSave();
        if (!validation.isValid) {
            this.openDialog(validation.error as string, Alert.ERROR);
            return;
        }
        if (this.checkNameValid()) {
            this.openDialog('Veuillez donner un nom valide à votre carte', Alert.ERROR);
            return;
        }

        const result = await this.openDialog('Êtes vous certain de vouloir sauvegarder?', Alert.CONFIRM);
        if (result) {
            this.saveBoard()
                .then(() => {
                    this.openDialog('Partie sauvegardée! Vous avez été redirigé.\n', Alert.SUCCESS);
                    this.router.navigate(['/admin']);
                })
                .catch((error) => {
                    this.openDialog(error, Alert.ERROR);
                });
        }
    }

    async confirmReturn() {
        const result = await this.openDialog(
            'Êtes vous certain de vouloir quitter cette page ?\nAucune modifications ne sera sauvegardée',
            Alert.CONFIRM,
        );
        if (result) {
            this.router.navigate(['/admin']);
        }
    }

    async reset() {
        const result = await this.openDialog('Êtes vous certain de vouloir réinitialiser ?\nToutes les modifications seront perdue', Alert.CONFIRM);
        if (result) {
            this.mapService.setBoardToFirstValue();
        }
    }

    ngOnInit() {
        this.mapService.setBoardToFirstValue();
    }

    async saveBoard(): Promise<string> {
        const mapData = this.mapService.getBoardToSave().value;
        let response;
        try {
            if (mapData._id) {
                response = await firstValueFrom(this.boardService.updateBoard(mapData));
            } else {
                const mapDataCreation = Object.assign({}, mapData);
                delete mapDataCreation._id;
                response = await firstValueFrom(this.boardService.addBoard(mapDataCreation));
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

    private async openDialog(message: string, type: Alert): Promise<boolean> {
        const dialogRef = this.dialog.open(AlertComponent, {
            data: { type, message },
            disableClose: true,
            hasBackdrop: true,
            backdropClass: 'backdrop-block',
            panelClass: 'alert-dialog',
        });
        return firstValueFrom(dialogRef.afterClosed());
    }
}
