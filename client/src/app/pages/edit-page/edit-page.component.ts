import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BoardGameComponent } from '@app/components/board-game/board-game.component';
import { EditItemAreaComponent } from '@app/components/edit-item-area/edit-item-area.component';
import { GameMap } from '@app/components/map-list/map-list.component';

@Component({
    selector: 'app-edit-page',
    templateUrl: './edit-page.component.html',
    styleUrls: ['./edit-page.component.scss'],
    imports: [EditItemAreaComponent, BoardGameComponent],
})
export class EditPageComponent implements OnInit {
    data: GameMap;
    constructor(private route: ActivatedRoute) {}
    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.data = {
                _id: params['_id'],
                name: params['name'],
                description: params['description'],
                size: params['size'],
                category: params['category'],
                isCTF: params['isCTF'],
                board: params['board'],
                status: params['status'],
                visibility: params['visibility'],
                image: params['image'],
                createdAt: params['createdAt'],
                updatedAt: params['updatedAt'],
            } as GameMap;
            // eslint-disable-next-line no-console
            console.log(this.data.board);
            // eslint-enable-next-line no-console
        });
    }
}
