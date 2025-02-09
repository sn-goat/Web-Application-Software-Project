import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AppMaterialModule } from '@app/modules/material.module';

@Component({
    selector: 'app-form-dialog',
    imports: [AppMaterialModule, FormsModule, NgIf],
    templateUrl: './form-dialog.component.html',
    styleUrl: './form-dialog.component.scss',
})
export class FormDialogComponent {
    data = {
        name: '',
        description: '',
        size: '10',
        ctf: false,
    };
    constructor(public dialogReg: MatDialogRef<FormDialogComponent>) {}
}
