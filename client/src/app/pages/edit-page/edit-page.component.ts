import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BoardGameComponent } from '@app/components/board-game/board-game.component';
import { EditFormComponent } from '@app/components/edit-form/edit-form.component';
import { EditItemAreaComponent } from '@app/components/edit-item-area/edit-item-area.component';

@Component({
    selector: 'app-edit-page',
    templateUrl: './edit-page.component.html',
    styleUrls: ['./edit-page.component.scss'],
    imports: [EditFormComponent, EditItemAreaComponent, BoardGameComponent],
})
export class EditPageComponent implements OnInit {
    data: unknown = {};
    constructor(private route: ActivatedRoute) {}
    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.data = params;
        });
    }
}
