import { Component } from '@angular/core';
import { MapSelectorComponent } from '@app/components/map-selector/map-selector.component';

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss',
  imports: [MapSelectorComponent],
})
export class AdminPageComponent {}
