import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { DEFAULT_PATH_AVATARS, DEFAULT_FILE_TYPE, DEFAULT_PATH_DICE } from '@app/constants/path';
import { GameService } from '@app/services/code/game.service';
import { PlayerStats, Dice } from '@common/player';
import { Subscription } from 'rxjs';
import { diceToImageLink } from '@app/constants/playerConst';

@Component({
    selector: 'app-game-map-player-detailed',
    imports: [CommonModule],
    templateUrl: './game-map-player-detailed.component.html',
    styleUrl: './game-map-player-detailed.component.scss',
})
export class GameMapPlayerDetailedComponent implements OnInit {
    readonly srcAvatar: string = DEFAULT_PATH_AVATARS;
    readonly srcDice: string = DEFAULT_PATH_DICE;
    readonly fileType: string = DEFAULT_FILE_TYPE;
    readonly diceToImageLink: (dice: Dice) => string = diceToImageLink;

    maxHealth: number = 0;
    myPlayer: PlayerStats | undefined;

    private gameService: GameService = inject(GameService);
    private clientPlayerSub: Subscription;

    ngOnInit() {
        this.clientPlayerSub = this.gameService.clientPlayer$.subscribe((player: PlayerStats | undefined) => {
            this.myPlayer = player;
            if (player) {
                this.maxHealth = player.life;
            }
        });
    }

    ngOndestroy() {
        this.clientPlayerSub.unsubscribe();
    }

    getHealthBar(): string {
        return 'health-hight';
    }

    roundHealth(health: number): number {
        return Math.round(health);
    }
}
