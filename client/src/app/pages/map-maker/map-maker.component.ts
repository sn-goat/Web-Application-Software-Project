import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BoardGameComponent } from '@app/components/board-game/board-game.component';
import { EditItemAreaComponent } from '@app/components/edit-item-area/edit-item-area.component';

@Component({
    selector: 'app-map-maker',
    imports: [MatSidenavModule, MatGridListModule, MatFormFieldModule, MatIconModule, BoardGameComponent, EditItemAreaComponent],
    templateUrl: './map-maker.component.html',
    styleUrl: './map-maker.component.scss',
})
export class MapMakerComponent {
    // data: GameMap;
    // constructor(private route: ActivatedRoute) {}
    // ngOnInit(): void {
    //     this.route.queryParams.subscribe((params) => {
    //         // eslint-disable-next-line no-console
    //         console.log(params);
    //         // eslint-enable-next-line no-console
    //         this.data = params as GameMap;
    //     });
    // }
}
