import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { BoardGameComponent } from '@app/components/board-game/board-game.component';
import { EditItemAreaComponent } from '@app/components/edit-item-area/edit-item-area.component';

@Component({
    selector: 'app-map-maker',
    imports: [MatSidenavModule, MatGridListModule, MatFormFieldModule, MatIconModule, BoardGameComponent, EditItemAreaComponent],
    templateUrl: './map-maker.component.html',
    styleUrl: './map-maker.component.scss',
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
