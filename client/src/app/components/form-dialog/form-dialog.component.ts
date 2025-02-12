import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AppMaterialModule } from '@app/modules/material.module';
import { Board } from '@common/board';
import { Visibility } from '@common/enums';

@Component({
    selector: 'app-form-dialog',
    imports: [AppMaterialModule, FormsModule, CommonModule],
    templateUrl: './form-dialog.component.html',
    styleUrl: './form-dialog.component.scss',
})
export class FormDialogComponent {
    data: Board;
    constructor(public dialogReg: MatDialogRef<FormDialogComponent>) {
        this.data = {
            _id: '',
            name: '',
            description: '',
            size: 0,
            board: [],
            isCTF: false,
            visibility: Visibility.PUBLIC,
            image: '',
            updatedAt: new Date(),
        };
    }
}
