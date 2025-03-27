import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '@app/components/common/snack-bar/snack-bar.component';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_ITEMS } from '@app/constants/path';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { Item } from '@common/enums';
import { IPlayer } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-map-player-tools',
    templateUrl: './game-map-player-tools.component.html',
    styleUrls: ['./game-map-player-tools.component.scss'],
})
export class GameMapPlayerToolsComponent implements OnInit, OnDestroy {
    items: Item[] = [];
    players: IPlayer[];
    timer: string = '';
    isActivePlayer: boolean = false;
    playerHasAction: boolean = false;
    isActionEnabled: boolean = false;
    debugMode: boolean = false;
    performAction: () => void;
    endTurn: () => void;
    readonly src = DEFAULT_PATH_ITEMS;
    readonly fileType = DEFAULT_FILE_TYPE;
    private readonly gameService: GameService = inject(GameService);
    private readonly playerService: PlayerService = inject(PlayerService);
    private readonly socketReceiver: SocketReceiverService = inject(SocketReceiverService);
    private readonly snackBar: MatSnackBar = inject(MatSnackBar);
    private subscriptions: Subscription[] = [];

    ngOnInit() {
        this.subscriptions.push(
            this.playerService.isActivePlayer.subscribe((isActive) => {
                this.isActivePlayer = isActive;
            }),

            this.playerService.myPlayer.subscribe((player) => {
                this.playerHasAction = (player?.actions ?? 0) > 0;
            }),

            this.gameService.isActionSelected.subscribe((isActive) => {
                this.isActionEnabled = isActive;
            }),

            this.socketReceiver.onTimerUpdate().subscribe((remainingTime) => {
                this.timer = `${remainingTime.toString()} s`;
            }),

            this.socketReceiver.onPlayerTurnChanged().subscribe((turnInfo) => {
                this.snackBar.openFromComponent(SnackbarComponent, {
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom',
                    panelClass: ['custom-snackbar'],
                    data: { message: `C'est au tour de ${turnInfo.player.name} de jouer` },
                });
            }),

            this.socketReceiver.onWinner().subscribe(() => {
                this.snackBar.openFromComponent(SnackbarComponent, {
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['custom-snackbar'],
                    data: { message: 'Tu as gagné le combat!' },
                });
            }),

            this.socketReceiver.onLoser().subscribe(() => {
                this.snackBar.openFromComponent(SnackbarComponent, {
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['custom-snackbar'],
                    data: { message: 'Tu as perdu le combat!' },
                });
            }),
        );

        this.performAction = this.gameService.toggleActionMode.bind(this.gameService);
        this.endTurn = this.gameService.endTurn.bind(this.gameService);
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
