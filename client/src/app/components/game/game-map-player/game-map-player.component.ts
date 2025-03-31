import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_AVATARS } from '@app/constants/path';
import { GameService } from '@app/services/game/game.service';
import { IPlayer } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-map-player',
    imports: [CommonModule],
    templateUrl: './game-map-player.component.html',
    styleUrl: './game-map-player.component.scss',
})
export class GameMapPlayerComponent implements OnInit, OnDestroy, AfterViewInit {
    readonly srcAvatar: string = DEFAULT_PATH_AVATARS;
    readonly fileType: string = DEFAULT_FILE_TYPE;

    players: IPlayer[] = [];
    playersInGame: IPlayer[];
    activePlayer: IPlayer | null;
    getOrganizerId: () => string;
    private readonly gameService: GameService = inject(GameService);
    private subscriptions: Subscription[] = [];

    ngOnInit() {
        this.subscriptions.push(
            this.gameService.playingPlayers.subscribe((gamePlayers: IPlayer[]) => {
                this.playersInGame = gamePlayers;
            }),

            this.gameService.initialPlayers.subscribe((gamePlayers: IPlayer[]) => {
                this.players = gamePlayers;
            }),

            this.gameService.activePlayer.subscribe((player: IPlayer | null) => {
                this.activePlayer = player;
            }),
        );
        this.getOrganizerId = this.gameService.getOrganizerId.bind(this.gameService);
    }

    ngAfterViewInit(): void {
        this.players = this.playersInGame;
    }

    playerIsInGame(player: IPlayer): boolean {
        return player && this.playersInGame.some((playerInGame) => playerInGame.id === player.id);
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        this.subscriptions = [];
    }
}
