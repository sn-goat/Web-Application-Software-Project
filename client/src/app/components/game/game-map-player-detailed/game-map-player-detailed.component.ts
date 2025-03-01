import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { DEFAULT_PATH_AVATARS, DEFAULT_FILE_TYPE, DEFAULT_PATH_DICE } from '@app/constants/path';
import { HEALTH_HIGH_THRESHOLD, HEALTH_MEDIUM_THRESHOLD, HEALTH_DECREMENT, HEALTH_MAX} from '@app/constants/health';
import { PlayerService } from '@app/services/code/player.service';
import { Player } from '@common/player';

@Component({
    selector: 'app-game-map-player-detailed',
    imports: [CommonModule],
    templateUrl: './game-map-player-detailed.component.html',
    styleUrl: './game-map-player-detailed.component.scss',
})
export class GameMapPlayerDetailedComponent implements OnInit, AfterViewInit {
    readonly srcAvatar: string = DEFAULT_PATH_AVATARS;
    readonly srcDice: string = DEFAULT_PATH_DICE;
    readonly fileType: string = DEFAULT_FILE_TYPE;

    maxHealth: number;
    player: Player;

    private playerService: PlayerService = inject(PlayerService);

    constructor() {
        this.player = {} as Player;
    }

    ngOnInit() {
        this.maxHealth = this.playerService.getPlayer(this.playerService.getPlayerUsername())?.life || 0;
        this.playerService.getPlayers().subscribe(() => {
            const player = this.playerService.getPlayer(this.playerService.getPlayerUsername());
            if (player !== undefined) {
                this.player = player;
            }
        });
    }

    // For testing purposes
    ngAfterViewInit(): void {
        const updatedPlayer = { ...this.player };
        updatedPlayer.life = this.player.life - HEALTH_DECREMENT;
        this.playerService.editPlayer(updatedPlayer);
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
