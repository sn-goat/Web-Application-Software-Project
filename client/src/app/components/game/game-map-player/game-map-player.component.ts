import { Component, inject, OnInit } from '@angular/core';
import { DEFAULT_PATH_AVATARS, DEFAULT_FILE_TYPE } from '@app/constants/path';
import { GameService } from '@app/services/code/game.service';
import { PlayerStats } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-map-player',
    imports: [],
    templateUrl: './game-map-player.component.html',
    styleUrl: './game-map-player.component.scss',
})
export class GameMapPlayerComponent implements OnInit {
    readonly srcAvatar: string = DEFAULT_PATH_AVATARS;
    readonly fileType: string = DEFAULT_FILE_TYPE;

    players: PlayerStats[];
    admin: string;
    activePlayer: PlayerStats | null;
    gameService: GameService = inject(GameService);
    private playersSub: Subscription;
    private activePlayerSub: Subscription;
    constructor() {
        this.players = [];
        this.admin = '';
    }

    ngOnInit() {
        this.playersSub = this.gameService.currentPlayers$.pipe().subscribe((gamePlayers: PlayerStats[]) => {
            this.players = gamePlayers;
        });

        this.activePlayerSub = this.gameService.activePlayer$.pipe().subscribe((player: PlayerStats | null) => {
            this.activePlayer = player;
        });
    }
    ngOndestroy() {
        this.playersSub.unsubscribe();
        this.activePlayerSub.unsubscribe();
    }
}
