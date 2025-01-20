import { Component } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';

export interface Card {
    header: string;
    title: string;
    subtitle: string;
    src: string;
    content: string;
    footer: string;
}

@Component({
    selector: 'app-dynamic-map-grid-component',
    templateUrl: 'map-grid.component.html',
    imports: [MatGridListModule, MatCardModule],
})
export class GridListDynamicComponent {
    cards: Card[] = [
        {
            header: 'ceci est le header youpi!',
            title: 'titre de la carte',
            subtitle: 'card subtitle',
            src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9pvSGI4Bv4mp6AhtsAtEyYwDGz7MT_KxD2g&s',
            content: 'Map selector fonctionne!',
            footer: 'ceci est le footer youpi!',
        },
        {
            header: 'ceci est le header youpi!',
            title: 'titre de la carte',
            subtitle: 'card subtitle',
            src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsVj4QHuxsJq3enpNmB6iDCfo0U_ePAcO33w&s',
            content: 'Map selector fonctionne!',
            footer: 'ceci est le footer youpi!',
        },
    ];
}
