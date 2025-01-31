import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-edit-tool-tile',
    templateUrl: './edit-tool-tile.component.html',
    styleUrl: './edit-tool-tile.component.scss',
})
export class EditToolTileComponent {
    @Input() type: string;
    @Input() alternate: string;

    src = './assets/tiles/';
    fileType = '.png';
}
