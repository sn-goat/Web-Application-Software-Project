import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { HEALTH_HIGH_THRESHOLD, HEALTH_MAX, HEALTH_MEDIUM_THRESHOLD } from '@app/constants/health';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_AVATARS, DEFAULT_PATH_DICE } from '@app/constants/path';
import { PlayerService } from '@app/services/code/player.service';
import { PlayerStats } from '@common/player';

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

    maxHealth: number;
    player: PlayerStats;

    private playerService: PlayerService = inject(PlayerService);

    constructor() {
        this.player = {} as PlayerStats;
    }

    ngOnInit() {
        this.maxHealth = this.playerService.getPlayer(this.playerService.getPlayerName())?.life || 0;
        this.playerService.players$.subscribe(() => {
            const player = this.playerService.getPlayer(this.playerService.getPlayerName());
            if (player !== undefined) {
                this.player = player;
            }
        });
    }

    getHealthBar(): string {
        const healthPercentage = this.roundHealth((this.player.life / this.maxHealth) * HEALTH_MAX);
        if (healthPercentage > HEALTH_HIGH_THRESHOLD) {
            return 'health-high';
        } else if (healthPercentage > HEALTH_MEDIUM_THRESHOLD) {
            return 'health-medium';
        } else {
            return 'health-low';
        }
    }

    roundHealth(health: number): number {
        return Math.round(health);
    }
}
