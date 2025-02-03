import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute } from '@angular/router';
import { BoardGameComponent } from '@app/components/board-game/board-game.component';
import { EditItemAreaComponent } from '@app/components/edit-item-area/edit-item-area.component';

@Component({
    selector: 'app-map-maker',
    imports: [MatSidenavModule, MatGridListModule, MatFormFieldModule, MatIconModule, MatMenuModule, MatButtonModule, BoardGameComponent, EditItemAreaComponent],
    templateUrl: './map-maker.component.html',
    styleUrls: ['./map-maker.component.scss'],
})
export class MapMakerComponent implements OnInit {
    data: { name: string; size: number; description: string } = { name: '', size: 10, description: '' };

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
