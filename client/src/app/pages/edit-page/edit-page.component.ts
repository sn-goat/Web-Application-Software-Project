import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BoardGameComponent } from '@app/components/board-game/board-game.component';
import { EditItemAreaComponent } from '@app/components/edit-item-area/edit-item-area.component';

@Component({
    selector: 'app-edit-page',
    templateUrl: './edit-page.component.html',
    styleUrls: ['./edit-page.component.scss'],
    imports: [EditItemAreaComponent, BoardGameComponent],
})
export class EditPageComponent implements OnInit {
    data: { name: string; size: number; description: string } = { name: '', size: 0, description: '' };
    constructor(private route: ActivatedRoute) {}
    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.data = {
                name: params['name'] || '',
                size: +params['size'] || 0,
                description: params['description'] || '',
            };
        });
    }
}
