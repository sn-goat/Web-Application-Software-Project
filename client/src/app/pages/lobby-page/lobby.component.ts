import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AlertComponent } from '@app/components/common/alert/alert.component';
import { Alert } from '@app/constants/enums';
import { diceToImageLink } from '@app/constants/playerConst';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { SocketService } from '@app/services/socket/socket.service';
import { IGame, IRoom } from '@common/game';
import { getLobbyLimit } from '@common/lobby-limits';
import { IPlayer } from '@common/player';
import { firstValueFrom, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-lobby',
    templateUrl: './lobby.component.html',
    styleUrls: ['./lobby.component.scss'],
    imports: [CommonModule, FormsModule],
})
export class LobbyComponent implements OnInit, OnDestroy {
    accessCode: string = '';
    players: IPlayer[] = [];
    isRoomLocked: boolean = false;
    isAdmin: boolean = false;
    maxPlayers: number = 0;
    readonly diceToImageLink = diceToImageLink;

    private readonly dialog = inject(MatDialog);
    private readonly socketEmitter = inject(SocketEmitterService);
    private readonly socketReceiver = inject(SocketReceiverService);
    private readonly router = inject(Router);
    private readonly gameService = inject(GameService);
    private readonly playerService = inject(PlayerService);
    private subscriptions: Subscription[] = [];

    ngOnInit() {
        if (history.state && history.state.accessCode) {
            this.accessCode = history.state.accessCode;
        }

        this.subscriptions.push(
            this.socketReceiver.onPlayerJoined().subscribe((room: IRoom) => {
                this.players = room.game.players;
                this.isRoomLocked = room.isLocked;
                this.accessCode = room.accessCode;
                this.checkIfAdmin();
            }),

            this.socketReceiver.onRoomLocked().subscribe(() => {
                this.isRoomLocked = true;
            }),

            this.socketReceiver.onPlayerRemoved().subscribe(async (players: IPlayer[]) => {
                this.players = players;
                if (!players.find((p) => p.id === this.playerService.getPlayer().id)) {
                    if (!this.isAdmin) {
                        await this.warning("Vous avez été retiré de la partie par l'admin, vous allez être redirigé vers la page d'accueil");
                        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
                        this.subscriptions = [];
                        this.router.navigate(['/acceuil']);
                    }
                }
            }),

            this.socketReceiver.onPlayerDisconnected().subscribe(async (players: IPlayer[]) => {
                this.players = players;
                if (!players.find((p) => p.id === this.playerService.getPlayer().id)) {
                    if (!this.isAdmin) {
                        await this.warning("Deconnexion de la partie. Vous allez être redirigé vers la page d'accueil");
                        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
                        this.subscriptions = [];
                        this.router.navigate(['/acceuil']);
                    }
                }
            }),

            this.socketReceiver.onAdminDisconnected().subscribe(async () => {
                const message = this.isAdmin
                    ? "Vous vous êtes déconnecté. Vous allez être redirigé vers la page d'accueil"
                    : "L'admin s'est déconnecté. Vous allez être redirigé vers la page d'accueil";
                await this.warning(message);
                this.subscriptions.forEach((subscription) => subscription.unsubscribe());
                this.subscriptions = [];
                this.router.navigate(['/acceuil']);
            }),

            this.socketReceiver.onBroadcastStartGame().subscribe((game: IGame) => {
                this.gameService.setGame(game);
                this.router.navigate(['/jeu']);
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        this.subscriptions = [];
    }

    checkIfAdmin() {
        this.isAdmin = this.players.length > 0 && this.players[0].id === this.socketService.getCurrentPlayerId();
    }

    toggleRoomLock() {
        if (this.players.length >= this.maxPlayers) {
            return;
        }
        if (this.isRoomLocked) {
            this.socketEmitter.unlockRoom();
            this.isRoomLocked = false;
        } else {
            this.socketEmitter.lockRoom();
            this.isRoomLocked = true;
        }
    }

    startGame() {
        this.socketEmitter.startGame();
    }

    removePlayer(playerId: string) {
        this.socketEmitter.removePlayer(playerId);
    }

    disconnect() {
        this.warning("Vous vous êtes déconnecté. Vous allez être redirigé vers la page d'accueil");

        const currentId = this.playerService.getPlayer().id;
        const currentAccessCode = this.accessCode;

        this.socketEmitter.disconnect(currentAccessCode, currentId);

        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        this.subscriptions = [];
        this.router.navigate(['/acceuil']);
    }

    async warning(message: string): Promise<void> {
        await this.openDialog(message, Alert.WARNING);
    }

    private async openDialog(message: string, type: Alert): Promise<boolean> {
        const dialogRef = this.dialog.open(AlertComponent, {
            data: { type, message },
            disableClose: true,
            hasBackdrop: true,
            backdropClass: 'backdrop-block',
            panelClass: 'alert-dialog',
        });
        return firstValueFrom(dialogRef.afterClosed());
    }
}
