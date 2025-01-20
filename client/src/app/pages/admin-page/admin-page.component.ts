import { Component } from '@angular/core';
import { GridListDynamicComponent } from '@app/components/map-grid/map-grid.component';
@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss',
  imports: [GridListDynamicComponent],
})
export class AdminPageComponent {}
