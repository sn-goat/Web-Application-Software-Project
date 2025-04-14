import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Alert } from '@app/constants/enums';

@Component({
    selector: 'app-alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.scss'],
    imports: [MatDialogModule, MatButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
    data = inject<{
        type: Alert;
        message: string;
    }>(MAT_DIALOG_DATA);

    formattedMessage: string;
    readonly alert = Alert;
    constructor() {
        const data = this.data;

        this.formattedMessage = data.message.replace(/\n/g, '<br>');
    }
}
