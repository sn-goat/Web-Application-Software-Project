import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AppMaterialModule } from '@app/modules/material.module';
import { Board } from '@common/board';
import { Size, Visibility } from '@common/enums';
import { GameFormData } from '@common/game';

@Component({
    selector: 'app-form-dialog',
    imports: [AppMaterialModule, FormsModule, CommonModule],
    templateUrl: './form-dialog.component.html',
    styleUrl: './form-dialog.component.scss',
})
export class FormDialogComponent {
    readonly data: GameFormData = {
        name: '',
        description: '',
        size: Size.Small,
        isCTF: false,
    };
    private readonly dialogRef: MatDialogRef<FormDialogComponent> = inject(MatDialogRef);

    submitForm(gameForm: NgForm): void {
        const nameControl = gameForm.controls['name'];
        const descriptionControl = gameForm.controls['description'];

        if (!gameForm.valid || this.isWhitespaceOnly(this.data.name) || this.isWhitespaceOnly(this.data.description)) {
            gameForm.control.markAllAsTouched();

            if (this.isWhitespaceOnly(this.data.name)) {
                nameControl?.setErrors({ whitespace: true });
            }

            if (this.isWhitespaceOnly(this.data.description)) {
                descriptionControl?.setErrors({ whitespace: true });
            }

            return;
        }

        this.dialogRef.close({
            ...this.data,
            name: this.data.name.trim(),
            board: [],
            visibility: Visibility.Private,
            image: '',
        } as Board);
    }

    isWhitespaceOnly(value: string | undefined): boolean {
        return !value || value.trim().length === 0;
    }
}
