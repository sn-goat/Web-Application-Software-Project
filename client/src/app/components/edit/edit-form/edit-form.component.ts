import { Component } from '@angular/core';

@Component({
    selector: 'app-edit-form',
    templateUrl: './edit-form.component.html',
    styleUrl: './edit-form.component.scss',
    imports: [],
})
export class EditFormComponent {
    mapName = '';
    hasModeCTF = false;
    mapDescription = '';
    isMapSaved = false;
    onSubmit() {
        this.isMapSaved = true;
    }
}
