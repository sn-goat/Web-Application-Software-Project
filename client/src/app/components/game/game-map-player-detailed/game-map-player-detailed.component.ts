import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DEFAULT_FILE_TYPE } from '@app/constants/path';
import { diceToImageLink } from '@app/constants/playerConst';
import { PlayerService } from '@app/services/player/player.service';
import { IPlayer } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-map-player-detailed',
    imports: [CommonModule],
    templateUrl: './game-map-player-detailed.component.html',
    styleUrl: './game-map-player-detailed.component.scss',
})
export class GameMapPlayerDetailedComponent implements OnInit, OnDestroy {
    readonly fileType: string = DEFAULT_FILE_TYPE;
    readonly diceToImageLink = diceToImageLink;

    maxHealth: number = 0;
    myPlayer: IPlayer | null;

    private playerService: PlayerService = inject(PlayerService);
    private subscriptions: Subscription[] = [];

    ngOnInit() {
        this.subscriptions.push(
            this.playerService.myPlayer.subscribe((player: IPlayer | null) => {
                this.myPlayer = player;
                if (player) {
                    this.maxHealth = player.life;
                }
            }),
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        this.subscriptions = [];
    }
}
