import { Component, ViewEncapsulation } from '@angular/core';
import { MapListComponent } from '@app/components/map-list/map-list.component';
@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrl: './admin-page.component.scss',
    imports: [MapListComponent],
    encapsulation: ViewEncapsulation.None,
})
export class AdminPageComponent {}
