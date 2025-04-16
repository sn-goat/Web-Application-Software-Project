import { Component, inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '@app/components/common/snack-bar/snack-bar.component';
import { SubLifecycleHandlerComponent } from '@app/components/common/sub-lifecycle-handler/subscription-lifecycle-handler.component';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_ITEMS } from '@app/constants/path';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { Item } from '@common/enums';

@Component({
    selector: 'app-game-map-player-tools',
    templateUrl: './game-map-player-tools.component.html',
    styleUrls: ['./game-map-player-tools.component.scss'],
})
export class GameMapPlayerToolsComponent extends SubLifecycleHandlerComponent implements OnInit {
    items: Item[] = [];
    timer: string = '';
    isActivePlayer: boolean = false;
    playerHasAction: boolean = false;
    isActionEnabled: boolean = false;
    debugMode: boolean = false;
    showTooltip: string | null = null;
    performAction: () => void;
    endTurn: () => void;
    readonly src = DEFAULT_PATH_ITEMS;
    readonly fileType = DEFAULT_FILE_TYPE;
    private readonly gameService: GameService = inject(GameService);
    private readonly playerService: PlayerService = inject(PlayerService);
    private readonly socketReceiver: SocketReceiverService = inject(SocketReceiverService);
    private readonly snackBar: MatSnackBar = inject(MatSnackBar);

    ngOnInit() {
        this.subscribeToSocketReceiver();
        this.subscribeToPlayerService();

        this.autoSubscribe(this.gameService.isActionSelected, (isActive) => {
            this.isActionEnabled = isActive;
        });

        this.performAction = this.gameService.toggleActionMode.bind(this.gameService);
        this.endTurn = this.gameService.endTurn.bind(this.gameService);
    }

    getDescription(type: Item): string {
        return ASSETS_DESCRIPTION.get(type) ?? '';
    }

    private subscribeToSocketReceiver() {
        this.autoSubscribe(this.socketReceiver.onTimerUpdate(), (remainingTime) => {
            this.timer = `${remainingTime.toString()} s`;
        });

        this.autoSubscribe(this.socketReceiver.onPlayerTurnChanged(), (turnInfo) => {
            this.snackBar.openFromComponent(SnackbarComponent, {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
                panelClass: ['custom-snackbar'],
                data: { message: `C'est au tour de ${turnInfo.player.name} de jouer` },
            });
        });

        this.autoSubscribe(this.socketReceiver.onWinner(), () => {
            this.snackBar.openFromComponent(SnackbarComponent, {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['custom-snackbar'],
                data: { message: 'Tu as gagné le combat!' },
            });
        });

        this.autoSubscribe(this.socketReceiver.onLoser(), () => {
            this.snackBar.openFromComponent(SnackbarComponent, {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['custom-snackbar'],
                data: { message: 'Tu as perdu le combat!' },
            });
        });
    }

    private subscribeToPlayerService() {
        this.autoSubscribe(this.playerService.isActivePlayer, (isActive) => {
            this.isActivePlayer = isActive;
        });

        this.autoSubscribe(this.playerService.myPlayer, (player) => {
            this.playerHasAction = (player?.actions ?? 0) > 0;
            this.items = player?.inventory ?? [];
        });
    }
}
