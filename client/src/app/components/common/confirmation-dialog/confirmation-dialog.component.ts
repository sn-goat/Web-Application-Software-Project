import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogData } from '@app/components/common/confirmation-dialog/confirmation-dialog-data';

@Component({
    selector: 'app-confirmation-dialog',
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    templateUrl: './confirmation-dialog.component.html',
    styleUrl: './confirmation-dialog.component.scss',
})
export class ConfirmationDialogComponent {
    dialogRef = inject<MatDialogRef<ConfirmationDialogComponent>>(MatDialogRef);
    data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }
}
