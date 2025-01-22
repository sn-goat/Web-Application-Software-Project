import { Component, Input } from '@angular/core';
import { Tiles, Items } from '@app/enum/tile';
@Component({
    selector: 'app-edit-tool',
    templateUrl: './edit-tool.component.html',
    styleUrl: './edit-tool.component.scss',
    imports: [],
})
export class EditToolComponent {
    @Input() type: Tiles | Items;
}
