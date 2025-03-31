import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TEAM_MEMBERS } from '@app/constants/team-members';
import { FightLogicService } from '@app/services/fight-logic/fight-logic.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { RoomService } from '@app/services/room/room.service';

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
    private readonly playerService = inject(PlayerService);
    private readonly gameService = inject(GameService);
    private readonly roomService = inject(RoomService);
    private readonly fightLogicService = inject(FightLogicService);
    handleGameLogoError(): void {
        this.gameLogoError = true;
    }

    ngOnInit() {
        this.gameService.resetGame();
        this.playerService.resetPlayers();
        this.fightLogicService.reset();
        this.roomService.reset();
    }
}
