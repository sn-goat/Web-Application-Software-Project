import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Alert } from '@app/constants/enums';

@Component({
    selector: 'app-alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.scss'],
    imports: [MatDialogModule, MatButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
    formattedMessage: string;
    readonly alert = Alert;
    constructor(@Inject(MAT_DIALOG_DATA) public data: { type: Alert; message: string }) {
        this.formattedMessage = data.message.replace(/\n/g, '<br>');
    }
}
