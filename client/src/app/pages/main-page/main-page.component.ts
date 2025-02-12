import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TEAM_MEMBERS } from '@app/constants/team-members';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
    imports: [RouterLink],
})
export class MainPageComponent {
    readonly title: string = 'POLYTOPIA';
    readonly teamMembers: string[] = TEAM_MEMBERS;
    readonly gameLogoPath: string = '/assets/POLYTOPIA_game_logo.png';
    gameLogoError: boolean = false;

    handleGameLogoError(): void {
        this.gameLogoError = true;
    }
}
