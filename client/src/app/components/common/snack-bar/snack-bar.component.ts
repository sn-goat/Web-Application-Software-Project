import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
    selector: 'app-custom-snackbar',
    templateUrl: './snack-bar.component.html',
    styleUrls: ['./snack-bar.component.scss'],
})
export class SnackbarComponent {
    data = inject<{
        message: string;
    }>(MAT_SNACK_BAR_DATA);
}
