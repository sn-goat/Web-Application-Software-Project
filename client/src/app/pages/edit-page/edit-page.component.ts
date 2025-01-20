import { Component } from '@angular/core';
import { EditFormComponent } from '@app/components/edit-form/edit-form.component';
import { EditItemAreaComponent } from '@app/components/edit-item-area/edit-item-area.component';
import { EditMapAreaComponent } from '@app/components/edit-map-area/edit-map-area.component';

@Component({
    selector: 'app-edit-page',
    templateUrl: './edit-page.component.html',
    styleUrls: ['./edit-page.component.scss'],
    imports: [EditFormComponent, EditItemAreaComponent, EditMapAreaComponent],
})
export class EditPageComponent {}
