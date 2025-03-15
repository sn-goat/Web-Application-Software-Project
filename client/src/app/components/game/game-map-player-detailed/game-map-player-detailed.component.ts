import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_AVATARS, DEFAULT_PATH_DICE } from '@app/constants/path';
import { diceToImageLink } from '@app/constants/playerConst';
import { GameService } from '@app/services/code/game.service';
import { Dice, PlayerStats } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-map-player-detailed',
    imports: [CommonModule],
    templateUrl: './game-map-player-detailed.component.html',
    styleUrl: './game-map-player-detailed.component.scss',
})
export class GameMapPlayerDetailedComponent implements OnInit, OnDestroy {
    readonly srcAvatar: string = DEFAULT_PATH_AVATARS;
    readonly srcDice: string = DEFAULT_PATH_DICE;
    readonly fileType: string = DEFAULT_FILE_TYPE;
    readonly diceToImageLink: (dice: Dice) => string = diceToImageLink;

    maxHealth: number = 0;
    myPlayer: PlayerStats | null;

    private gameService: GameService = inject(GameService);
    private subscriptions: Subscription[] = [];

    ngOnInit() {
        this.subscriptions.push(
            this.gameService.clientPlayer$.subscribe((player: PlayerStats | null) => {
                this.myPlayer = player;
                if (player) {
                    this.maxHealth = player.life;
                }
            }),
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    getHealthBar(): string {
        return 'health-hight';
    }

    roundHealth(health: number): number {
        return Math.round(health);
    }
}
