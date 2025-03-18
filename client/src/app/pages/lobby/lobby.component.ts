import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AlertComponent } from '@app/components/common/alert/alert.component';
import { Alert } from '@app/constants/enums';
import { diceToImageLink } from '@app/constants/playerConst';
import { GameService } from '@app/services/code/game.service';
import { SocketService } from '@app/services/code/socket.service';
import { Game, Room } from '@common/game';
import { getLobbyLimit } from '@common/lobby-limits';
import { PlayerStats } from '@common/player';
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
    players: PlayerStats[] = [];
    isRoomLocked: boolean = false;
    isAdmin: boolean = false;
    maxPlayers: number = 0;
    diceToImageLink = diceToImageLink;

    private readonly dialog = inject(MatDialog);
    private subscriptions: Subscription[] = [];

    constructor(
        private socketService: SocketService,
        private router: Router,
        private gameService: GameService,
    ) {}

    ngOnInit() {
        const gameSize = this.socketService.getGameSize();
        this.maxPlayers = getLobbyLimit(gameSize);

        if (history.state && history.state.accessCode) {
            this.accessCode = history.state.accessCode;
        }

        // Utiliser la méthode addSubscription pour chaque souscription
        this.addSubscription(
            this.socketService
                .onPlayerJoined()
                .pipe(map((response: { room: Room } | Room) => ('room' in response ? response.room : response)))
                .subscribe((room: Room) => {
                    this.players = room.players;
                    this.accessCode = room.accessCode;
                    this.checkIfAdmin();
                }),
        );

        this.addSubscription(
            this.socketService.onPlayersList().subscribe((players: PlayerStats[]) => {
                this.players = players;
                if (this.players.length === this.maxPlayers && !this.isRoomLocked) {
                    this.socketService.lockRoom(this.accessCode);
                    this.isRoomLocked = true;
                } else if (this.players.length < this.maxPlayers && this.isRoomLocked) {
                    this.socketService.unlockRoom(this.accessCode);
                    this.isRoomLocked = false;
                }
            }),
        );

        this.addSubscription(
            this.socketService.onRoomLocked().subscribe(() => {
                this.isRoomLocked = true;
            }),
        );

        this.addSubscription(
            this.socketService.onPlayerRemoved().subscribe(async (players: PlayerStats[]) => {
                this.players = players;
                if (!players.find((p) => p.id === this.socketService.getCurrentPlayerId())) {
                    if (!this.isAdmin) {
                        await this.warning("Vous avez été retiré de la partie par l'admin, vous allez être redirigé vers la page d'accueil");
                        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
                        this.subscriptions = [];
                        this.socketService.resetSocketState();
                        this.router.navigate(['/home']);
                    }
                }
            }),
        );

        this.addSubscription(
            this.socketService.onPlayerDisconnected().subscribe(async (players: PlayerStats[]) => {
                this.players = players;
                if (!players.find((p) => p.id === this.socketService.getCurrentPlayerId())) {
                    if (!this.isAdmin) {
                        await this.warning("Deconnexion de la partie. Vous allez être redirigé vers la page d'accueil");
                        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
                        this.subscriptions = [];
                        this.socketService.resetSocketState();
                        this.router.navigate(['/home']);
                    }
                }
            }),
        );

        this.addSubscription(
            this.socketService.onAdminDisconnected().subscribe(async () => {
                const message = this.isAdmin
                    ? "Vous vous êtes déconnecté. Vous allez être redirigé vers la page d'accueil"
                    : "L'admin s'est déconnecté. Vous allez être redirigé vers la page d'accueil";
                await this.warning(message);
                this.subscriptions.forEach((subscription) => subscription.unsubscribe());
                this.subscriptions = [];
                this.socketService.resetSocketState();
                this.router.navigate(['/home']);
            }),
        );

        this.addSubscription(
            this.socketService.onBroadcastStartGame().subscribe((game: Game) => {
                this.gameService.setGame(game);
                this.router.navigate(['/game']);
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
            this.socketService.unlockRoom(this.accessCode);
            this.isRoomLocked = false;
        } else {
            this.socketService.lockRoom(this.accessCode);
            this.isRoomLocked = true;
        }
    }

    configureGame() {
        this.socketService.configureGame(this.accessCode, this.players);
    }

    removePlayer(playerId: string) {
        this.socketService.removePlayer(this.accessCode, playerId);
    }

    disconnect() {
        // Afficher la confirmation pour l'admin
        this.warning("Vous vous êtes déconnecté. Vous allez être redirigé vers la page d'accueil");

        const currentId = this.socketService.getCurrentPlayerId();
        const currentAccessCode = this.accessCode;

        this.socketService.disconnect(currentAccessCode, currentId);

        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        this.subscriptions = [];

        this.socketService.resetSocketState();

        this.router.navigate(['/home']);
    }

    getCurrentPlayerId(): string {
        return this.socketService.getCurrentPlayerId();
    }

    async warning(message: string): Promise<void> {
        await this.openDialog(message, Alert.WARNING);
    }

    private addSubscription(subscription: Subscription): void {
        this.subscriptions.push(subscription);
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
