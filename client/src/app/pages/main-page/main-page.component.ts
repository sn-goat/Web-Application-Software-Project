import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { FormDialogComponent } from '@app/components/form-dialog/form-dialog.component';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
    imports: [RouterLink],
})
export class MainPageComponent {
    readonly title: string = 'POLYTOPIA';
    gameLogoPath: string = '/assets/POLYTOPIA_game_logo.png';
    gameLogoError: boolean = false;
    private gameLogoElement: HTMLImageElement | null = null;

    constructor(
        private dialog: MatDialog,
        private router: Router,
    ) {
        this.verifyImage();
    }

    openForm(): void {
        const dialogRef = this.dialog.open(FormDialogComponent, {
            width: '280px',
            data: { name: '', description: '', size: '10' },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                // Navigate to /edit with the data as query params
                this.router.navigate(['/edit'], { queryParams: result });
            }
        });
    }

    handleGameLogoError() {
        this.gameLogoError = true;
    }

    verifyImage() {
        this.gameLogoElement = new Image();
        this.gameLogoElement.src = this.gameLogoPath;

        this.gameLogoElement.onerror = () => {
            this.handleGameLogoError();
        };
    }
}
