import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_ITEMS } from '@app/constants/path';
import { GameService } from '@app/services/code/game.service';
import { PlayerService } from '@app/services/code/player.service';
import { SocketService } from '@app/services/code/socket.service';
import { Item } from '@common/enums';
import { PlayerStats } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-map-player-tools',
    templateUrl: './game-map-player-tools.component.html',
    styleUrls: ['./game-map-player-tools.component.scss'],
})
export class GameMapPlayerToolsComponent implements OnInit, OnDestroy {
    items: Item[];
    players: PlayerStats[];
    timer: string;
    activePlayer: PlayerStats | null = null;
    isActivePlayer: boolean = false;
    playerHasAction: boolean = false;
    isActionEnabled: boolean = false;

    readonly src = DEFAULT_PATH_ITEMS;
    readonly fileType = DEFAULT_FILE_TYPE;

    playerService: PlayerService = inject(PlayerService);
    private gameService: GameService = inject(GameService);
    private socketService: SocketService = inject(SocketService);
    private subscriptions: Subscription[] = [];

    constructor(private snackBar: MatSnackBar) {
        this.items = [];
        this.timer = '';
    }

    ngOnInit() {
        this.subscriptions.push(
            this.socketService.onTimerUpdate().subscribe((time: { remainingTime: number }) => {
                this.timer = `${time.remainingTime.toString()} s`;
            }),

            this.playerService.isActivePlayer.subscribe((isActive) => {
                this.isActivePlayer = isActive;
            }),

            this.playerService.myPlayer.subscribe((player) => {
                this.playerHasAction = (player?.actions ?? 0) > 0;
            }),

            this.gameService.isActionSelected.subscribe((isActive) => {
                this.isActionEnabled = isActive;
            }),

            this.gameService.activePlayer.subscribe((player: PlayerStats | null) => {
                this.activePlayer = player;
            }),

            this.socketService.onTurnSwitch().subscribe((turnInfo) => {
                this.activePlayer = turnInfo.player;

                if (!this.isActivePlayer && this.activePlayer) {
                    this.snackBar.dismiss();
                    this.snackBar.open(`C'est au tour de ${this.activePlayer.name} de jouer`, 'Fermer', {
                        duration: 3000,
                        horizontalPosition: 'center',
                        verticalPosition: 'bottom',
                        panelClass: ['custom-snackbar'],
                    });
                }
            }),

            this.socketService.onWinner().subscribe(() => {
                this.snackBar.open('Tu as gagner le combat!', 'Fermer', {
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['custom-snackbar'],
                });
            }),

            this.socketService.onLoser().subscribe(() => {
                this.snackBar.open('Tu as perdu le combat!', 'Fermer', {
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['custom-snackbar'],
                });
            }),
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    endTurn(): void {
        this.gameService.endTurn();
    }

    performAction(): void {
        this.gameService.toggleActionMode();
    }
}
