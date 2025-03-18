import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TEAM_MEMBERS } from '@app/constants/team-members';
import { GameService } from '@app/services/game/game.service';
import { SocketService } from '@app/services/socket/socket.service';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
    imports: [RouterLink],
})
export class MainPageComponent implements OnInit {
    readonly title: string = 'POLYTOPIA';
    readonly teamMembers: string[] = TEAM_MEMBERS;
    readonly gameLogoPath: string = './assets/POLYTOPIA_game_logo.png';
    gameLogoError: boolean = false;
    private socketService = inject(SocketService);
    private gameService = inject(GameService);
    handleGameLogoError(): void {
        this.gameLogoError = true;
    }

    ngOnInit() {
        this.socketService.resetSocketState();
        this.gameService.resetGame();
    }
}
