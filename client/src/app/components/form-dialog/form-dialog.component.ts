import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AppMaterialModule } from '@app/modules/material.module';
import { Board } from '@common/board';
import { Visibility } from '@common/enums';

interface GameFormData {
    name: string;
    description: string;
    size: number;
    isCTF: boolean;
}

@Component({
    selector: 'app-form-dialog',
    imports: [AppMaterialModule, FormsModule, CommonModule],
    templateUrl: './form-dialog.component.html',
    styleUrl: './form-dialog.component.scss',
})
export class FormDialogComponent {
    data: GameFormData;

    constructor(public dialogRef: MatDialogRef<FormDialogComponent>) {
        this.data = {
            name: '',
            description: '',
            size: 10,
            isCTF: false,
        };
    }

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
            visibility: Visibility.PRIVATE,
            image: '',
        } as Board);
    }

    isWhitespaceOnly(value: string | undefined): boolean {
        return !value || value.trim().length === 0;
    }
}
