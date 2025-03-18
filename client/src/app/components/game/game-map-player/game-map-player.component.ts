import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
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
export class GameMapPlayerComponent implements OnInit, OnDestroy, AfterViewInit {
    readonly srcAvatar: string = DEFAULT_PATH_AVATARS;
    readonly fileType: string = DEFAULT_FILE_TYPE;

    players: PlayerStats[] = [];
    playersInGame: PlayerStats[];
    activePlayer: PlayerStats | null;
    getOrganizerId: () => string;
    private readonly gameService: GameService = inject(GameService);
    private readonly socketService: SocketService = inject(SocketService);
    private subscriptions: Subscription[] = [];

    ngOnInit() {
        this.subscriptions.push(
            this.gameService.playingPlayers.subscribe((gamePlayers: PlayerStats[]) => {
                this.playersInGame = gamePlayers;
            }),

            this.gameService.activePlayer.subscribe((player: PlayerStats | null) => {
                this.activePlayer = player;
            }),

            this.socketService.onWinner().subscribe((winner: PlayerStats) => {
                const playerToUpdate = this.playersInGame.findIndex((player) => winner.id === player.id);
                this.playersInGame[playerToUpdate] = winner;
            }),
        );
        this.getOrganizerId = this.gameService.getOrganizerId;
    }

    ngAfterViewInit(): void {
        this.players = this.playersInGame;
    }

    playerIsInGame(player: PlayerStats): boolean {
        return this.playersInGame.some((p) => p.id === player.id);
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        this.socketService.resetSocketState();
    }
}
