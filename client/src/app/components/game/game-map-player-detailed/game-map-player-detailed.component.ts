import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { SubLifecycleHandlerComponent } from '@app/components/common/sub-lifecycle-handler/subscription-lifecycle-handler.component';
import { DEFAULT_FILE_TYPE } from '@app/constants/path';
import { diceToImageLink } from '@app/constants/player-constants';
import { PlayerService } from '@app/services/player/player.service';
import { IPlayer } from '@common/player';

@Component({
    selector: 'app-game-map-player-detailed',
    imports: [CommonModule],
    templateUrl: './game-map-player-detailed.component.html',
    styleUrl: './game-map-player-detailed.component.scss',
})
export class GameMapPlayerDetailedComponent extends SubLifecycleHandlerComponent implements OnInit {
    readonly fileType: string = DEFAULT_FILE_TYPE;
    readonly diceToImageLink = diceToImageLink;

    maxHealth: number = 0;
    myPlayer: IPlayer | null;

    private playerService: PlayerService = inject(PlayerService);

    ngOnInit() {
        this.autoSubscribe(this.playerService.myPlayer, (player: IPlayer | null) => {
            this.myPlayer = player;
            if (player) {
                this.maxHealth = player.life;
            }
        });
    }
}
