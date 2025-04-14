import { AfterViewInit, Component, HostListener, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChatComponent } from '@app/components/chat/chat.component';
import { AlertComponent } from '@app/components/common/alert/alert.component';
import { HeaderBarComponent } from '@app/components/common/header-bar/header-bar.component';
import { StatsComponent } from '@app/components/stats/stats.component';
import { Alert } from '@app/constants/enums';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
    selector: 'app-stats-page',
    imports: [StatsComponent, ChatComponent, HeaderBarComponent],
    templateUrl: './stats-page.component.html',
    styleUrl: './stats-page.component.scss',
})
export class StatsPageComponent implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild(HeaderBarComponent) headerBar!: HeaderBarComponent;

    private gameService = inject(GameService);
    private readonly socketEmitter = inject(SocketEmitterService);
    private readonly playerService = inject(PlayerService);
    private readonly socketReceiver = inject(SocketReceiverService);
    private router = inject(Router);
    private readonly dialog = inject(MatDialog);
    private subscriptions: Subscription[] = [];

    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(): void {
        this.socketEmitter.disconnect(this.playerService.getPlayer().id);
    }

    ngOnInit(): void {
        this.subscriptions.push(
            this.socketReceiver.onPlayerRemoved().subscribe((message: string) => {
                this.warning(message);
            }),
        );
    }

    ngAfterViewInit(): void {
        const originalQuitMethod = this.headerBar.getBack;

        this.headerBar.getBack = async () => {
            const confirmed = await this.gameService.confirmAndQuitGame();
            if (confirmed) {
                this.socketEmitter.disconnect(this.playerService.getPlayer().id);
                return originalQuitMethod.call(this.headerBar);
            }
        };
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
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

    private warning(message: string): void {
        this.openDialog(message, Alert.WARNING).then(() => {
            this.router.navigate(['/accueil']);
        });
    }
}
