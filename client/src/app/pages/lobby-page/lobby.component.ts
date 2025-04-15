import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChatComponent } from '@app/components/chat/chat.component';
import { AlertComponent } from '@app/components/common/alert/alert.component';
import { SubLifecycleHandlerComponent } from '@app/components/common/sub-lifecycle-handler/subscription-lifecycle-handler.component';
import { FormVirtualPlayerComponent } from '@app/components/form-virtual-player/form-virtual-player.component';
import { Alert } from '@app/constants/enums';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { RoomService } from '@app/services/room/room.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { IGame } from '@common/game';
import { IPlayer } from '@common/player';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-lobby',
    templateUrl: './lobby.component.html',
    styleUrls: ['./lobby.component.scss'],
    imports: [CommonModule, FormsModule, ChatComponent],
})
export class LobbyComponent extends SubLifecycleHandlerComponent implements OnInit {
    accessCode: string = '';
    players: IPlayer[] = [];
    isRoomLocked: boolean = false;
    isAdmin: boolean = false;
    maxPlayers: number = 0;

    private readonly dialog = inject(MatDialog);
    private readonly socketEmitter = inject(SocketEmitterService);
    private readonly socketReceiver = inject(SocketReceiverService);
    private readonly router = inject(Router);
    private readonly roomService = inject(RoomService);
    private readonly gameService = inject(GameService);
    private readonly playerService = inject(PlayerService);

    ngOnInit(): void {
        this.isAdmin = this.playerService.isPlayerAdmin();
        this.accessCode = this.socketEmitter.getAccessCode();

        this.subscribeToRoomService();

        this.subscribeToSocketReceiver();
    }

    getPlayerId(): string {
        return this.playerService.getPlayer().id;
    }

    toggleRoomLock(): void {
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

    startGame(): void {
        this.socketEmitter.startGame();
    }

    expelPlayer(playerId: string): void {
        this.socketEmitter.expelPlayer(playerId);
    }

    disconnect(): void {
        const currentId = this.playerService.getPlayer().id;
        this.socketEmitter.disconnect(currentId);
    }

    openVirtualPlayerForm(): void {
        this.dialog.open(FormVirtualPlayerComponent, {
            width: '400px',
            disableClose: true,
        });
    }

    isRoomFull(): boolean {
        return this.players.length >= this.maxPlayers;
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

    private subscribeToSocketReceiver() {
        this.autoSubscribe(this.socketReceiver.onRoomUnlocked(), () => {
            this.isRoomLocked = false;
        });

        this.autoSubscribe(this.socketReceiver.onPlayersUpdated(), (players: IPlayer[]) => {
            this.players = players;
        });

        this.autoSubscribe(this.socketReceiver.onPlayerRemoved(), async (message: string) => {
            await this.warning(message);
            this.router.navigate(['/accueil']);
        });

        this.autoSubscribe(this.socketReceiver.onGameStartedError(), (message: string) => {
            this.openDialog(message, Alert.WARNING);
        });

        this.autoSubscribe(this.socketReceiver.onGameStarted(), (game: IGame) => {
            this.gameService.setGame(game);
            this.router.navigate(['/jeu']);
        });
    }

    private subscribeToRoomService() {
        this.autoSubscribe(this.roomService.connected, (players) => {
            this.players = players;
        });

        this.autoSubscribe(this.roomService.isRoomLocked, (isLocked) => {
            this.isRoomLocked = isLocked;
        });

        this.autoSubscribe(this.roomService.maxPlayer, (maxPlayers) => {
            this.maxPlayers = maxPlayers;
        });
    }
}
