import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChatComponent } from '@app/components/chat/chat.component';
import { AlertComponent } from '@app/components/common/alert/alert.component';
import { FormVirtualPlayerComponent } from '@app/components/form-virtual-player/form-virtual-player.component';
import { Alert } from '@app/constants/enums';
import { diceToImageLink } from '@app/constants/player-constants';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { RoomService } from '@app/services/room/room.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { IGame } from '@common/game';
import { IPlayer } from '@common/player';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
    selector: 'app-lobby',
    templateUrl: './lobby.component.html',
    styleUrls: ['./lobby.component.scss'],
    imports: [CommonModule, FormsModule, ChatComponent],
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
    private readonly roomService = inject(RoomService);
    private readonly gameService = inject(GameService);
    private readonly playerService = inject(PlayerService);
    private subscriptions: Subscription[] = [];

    ngOnInit() {
        this.isAdmin = this.playerService.isPlayerAdmin();
        this.accessCode = this.socketEmitter.getAccessCode();

        this.subscriptions.push(
            this.roomService.connected.subscribe((players) => {
                this.players = players;
            }),

            this.roomService.isRoomLocked.subscribe((isLocked) => {
                this.isRoomLocked = isLocked;
            }),

            this.roomService.maxPlayer.subscribe((maxPlayers) => {
                this.maxPlayers = maxPlayers;
            }),

            this.socketReceiver.onRoomUnlocked().subscribe(() => {
                this.isRoomLocked = false;
            }),

            this.socketReceiver.onPlayersUpdated().subscribe((players: IPlayer[]) => {
                this.players = players;
            }),

            this.socketReceiver.onPlayerRemoved().subscribe(async (message: string) => {
                await this.warning(message);
                this.subscriptions.forEach((subscription) => subscription.unsubscribe());
                this.subscriptions = [];
                this.router.navigate(['/accueil']);
            }),

            this.socketReceiver.onGameStartedError().subscribe((message: string) => {
                this.openDialog(message, Alert.WARNING);
            }),

            this.socketReceiver.onGameStarted().subscribe((game: IGame) => {
                this.gameService.setGame(game);
                this.router.navigate(['/jeu']);
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        this.subscriptions = [];
    }

    getPlayerId(): string {
        return this.playerService.getPlayer().id;
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

    expelPlayer(playerId: string) {
        this.socketEmitter.expelPlayer(playerId);
    }

    disconnect() {
        const currentId = this.playerService.getPlayer().id;
        this.socketEmitter.disconnect(currentId);
    }

    openVirtualPlayerForm() {
        this.dialog.open(FormVirtualPlayerComponent, {
            width: '400px',
            disableClose: true,
        });
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
