import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_AVATARS } from '@app/constants/path';
import { GameService } from '@app/services/code/game.service';
import { SocketService } from '@app/services/code/socket.service';
import { PlayerStats } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-map-player',
    imports: [],
    templateUrl: './game-map-player.component.html',
    styleUrl: './game-map-player.component.scss',
})
export class GameMapPlayerComponent implements OnInit, OnDestroy {
    readonly srcAvatar: string = DEFAULT_PATH_AVATARS;
    readonly fileType: string = DEFAULT_FILE_TYPE;

    players: PlayerStats[];
    activePlayer: PlayerStats | null;
    gameService: GameService = inject(GameService);
    socketService: SocketService = inject(SocketService);
    private subscriptions: Subscription[] = [];
    constructor() {
        this.players = [];
    }

    ngOnInit() {
        this.subscriptions.push(
            this.gameService.playingPlayers.subscribe((gamePlayers: PlayerStats[]) => {
                this.players = gamePlayers;
            }),

            this.gameService.activePlayer.subscribe((player: PlayerStats | null) => {
                this.activePlayer = player;
            }),

            this.socketService.onWinner().subscribe((winner: PlayerStats) => {
                for (let index = 0; index < this.players.length; index++) {
                    if (this.players[index].id === winner.id) {
                        this.players[index] = winner;
                    }
                }
            }),
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
