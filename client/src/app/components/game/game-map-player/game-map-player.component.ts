import { Component, inject, OnInit } from '@angular/core';
import { DEFAULT_PATH_AVATARS, DEFAULT_FILE_TYPE } from '@app/constants/path';
import { MAX_PLAYERS } from '@app/constants/playerConst';
import { PlayerService } from '@app/services/code/player.service';
import { Player } from '@common/player';

@Component({
    selector: 'app-game-map-player',
    imports: [],
    templateUrl: './game-map-player.component.html',
    styleUrl: './game-map-player.component.scss',
})
export class GameMapPlayerComponent implements OnInit {
    readonly srcAvatar: string = DEFAULT_PATH_AVATARS;
    readonly fileType: string = DEFAULT_FILE_TYPE;

    players: Set<Player>;

    private playerService: PlayerService = inject(PlayerService);

    constructor() {
        this.players = new Set<Player>();
    }

    ngOnInit() {
        this.playerService.players$.subscribe((players) => {
            if (players !== undefined) {
                this.players = players;
            }
        });
    }

    rangeEmptyPlayerSlot(): number[] {
        return Array.from({ length: MAX_PLAYERS - this.players.size }, (_, i) => i);
    }
}
