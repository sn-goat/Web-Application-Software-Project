import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-edit-tool',
    templateUrl: './edit-tool.component.html',
    styleUrl: './edit-tool.component.scss',
})
export class EditToolComponent {
    @Input() type: string;
    @Input() alternate: string;

    src = './assets/tiles/';
    fileType = '.png';
}
