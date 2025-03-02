import { Component, inject, OnInit } from '@angular/core';
import { DEFAULT_PATH_AVATARS, DEFAULT_FILE_TYPE } from '@app/constants/path';
import { MAX_PLAYERS } from '@app/constants/playerConst';
import { PlayerService } from '@app/services/code/player.service';
import { GameService } from '@app/services/code/game.service';
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

    players: Player[];
    admin: string;
    activePlayer: string;
    playersWins: Map<string, number>;
    playersInGame: Map<string, boolean>;

    private playerService: PlayerService = inject(PlayerService);
    private gameService: GameService = inject(GameService);

    constructor() {
        this.players = [];
        this.admin = '';
        this.activePlayer = '';
        this.playersWins = new Map();
    }

    ngOnInit() {
        this.playerService.players$.subscribe((players) => {
            if (players !== undefined) {
                this.players = players;
            }
        });

        this.playerService.activePlayer$.subscribe((player) => {
            this.activePlayer = player;
        });

        this.playerService.admin$.subscribe((admin) => {
            this.admin = admin;
        });

        this.gameService.playersWinsMap$.subscribe((playersWins) => {
            this.playersWins = playersWins;
        });

        this.gameService.playersInGameMap$.subscribe((playersInGame) => {
            this.playersInGame = playersInGame;
        });
    }

    rangeEmptyPlayerSlot(): number[] {
        return Array.from({ length: MAX_PLAYERS - this.players.length }, (_, i) => i);
    }
}
