import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
    imports: [RouterLink],
})
export class MainPageComponent {
    readonly title: string = 'POLYTOPIA';
    gameLogoPath: string = '/assets/POLYTOPIA_game_logo.png';
    gameLogoError: boolean = false;
    private gameLogoElement: HTMLImageElement | null = null;

    constructor() {
        this.verifyImage();
    }

    handleGameLogoError() {
        this.gameLogoError = true;
    }

    verifyImage() {
        this.gameLogoElement = new Image();
        this.gameLogoElement.src = this.gameLogoPath;

        this.gameLogoElement.onerror = () => {
            this.handleGameLogoError();
        };
    }
}
