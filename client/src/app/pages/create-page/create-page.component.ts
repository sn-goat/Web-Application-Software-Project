import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormCharacterComponent } from '@app/components/form-character/form-character.component';
import { MapListComponent } from '@app/components/map-list/map-list.component';

@Component({
    selector: 'app-create-page',
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
    imports: [CommonModule, FormsModule, MapListComponent, FormCharacterComponent],
    encapsulation: ViewEncapsulation.None,
})
export class CreatePageComponent {
    isPopupVisible = false;

    openPopup() {
        this.isPopupVisible = true;
    }

    closePopup() {
        this.isPopupVisible = false;
    }
}
