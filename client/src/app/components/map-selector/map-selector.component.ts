import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-map-selector',
    imports: [MatCardModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './map-selector.component.html',
    styleUrl: './map-selector.component.scss',
})
export class MapSelectorComponent {}
