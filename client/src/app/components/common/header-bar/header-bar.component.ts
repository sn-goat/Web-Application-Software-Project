import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { AlertComponent } from '@app/components/common/alert/alert.component';
import { Alert } from '@app/constants/enums';
import { firstValueFrom } from 'rxjs';
@Component({
    selector: 'app-header-bar',
    imports: [MatIconModule, MatButtonModule, MatToolbarModule],
    templateUrl: './header-bar.component.html',
    styleUrl: './header-bar.component.scss',
})
export class HeaderBarComponent {
    @Input() backUrl: string = 'accueil';
    @Input() showDialog: boolean = false;
    @Input() message: string = 'Êtes-vous sûre de vouloir revenir en arrière?';
    @Input() isGamePage: boolean = false;

    constructor(
        private router: Router,
        private dialog: MatDialog,
    ) {}
    async getBack() {
        if (this.showDialog) {
            const result = await this.openDialog(this.message, Alert.CONFIRM);
            if (result) {
                this.router.navigate(['/' + this.backUrl]);
            }
        } else {
            this.router.navigate(['/' + this.backUrl]);
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
