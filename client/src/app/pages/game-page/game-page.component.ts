import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, HostListener, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AlertComponent } from '@app/components/common/alert/alert.component';
import { HeaderBarComponent } from '@app/components/common/header-bar/header-bar.component';
import { GameFightInterfaceComponent } from '@app/components/game/game-fight-interface/game-fight-interface.component';
import { GameMapInfoComponent } from '@app/components/game/game-map-info/game-map-info.component';
import { GameMapPlayerDetailedComponent } from '@app/components/game/game-map-player-detailed/game-map-player-detailed.component';
import { GameMapPlayerToolsComponent } from '@app/components/game/game-map-player-tools/game-map-player-tools.component';
import { GameMapPlayerComponent } from '@app/components/game/game-map-player/game-map-player.component';
import { GameMapComponent } from '@app/components/game/game-map/game-map.component';
import { Alert } from '@app/constants/enums';
import { FightLogicService } from '@app/services/fight-logic/fight-logic.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketService } from '@app/services/socket/socket.service';
import { firstValueFrom, Subscription, timer } from 'rxjs';

@Component({
    selector: 'app-game-page',
    imports: [
        GameMapComponent,
        GameMapInfoComponent,
        GameMapPlayerDetailedComponent,
        GameMapPlayerToolsComponent,
        GameMapPlayerComponent,
        HeaderBarComponent,
        CommonModule,
        GameFightInterfaceComponent,
    ],
    templateUrl: './game-page.component.html',
    styleUrl: './game-page.component.scss',
})
export class GamePageComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(HeaderBarComponent) headerBar!: HeaderBarComponent;

    showFightInterface: boolean = false;
    showChat = false;
    showInfo = false;
    debugMode = false;

    private readonly quitGameMessage = "Vous avez été déconnecté de la partie, vous allez être redirigé vers la page d'accueil.";
    private readonly notEnoughPlayersMessage = "Pas assez de joueurs pour continuer la partie. Vous allez être redirigé vers la page d'accueil.";
    private readonly endGameTimeoutInS = 5000;
    private subscriptions: Subscription[] = [];
    private quitGameSubscription: Subscription;
    private gameService = inject(GameService);
    private fightLogicService = inject(FightLogicService);
    private playerService = inject(PlayerService);
    private socketService = inject(SocketService);
    private router = inject(Router);

    private readonly dialog = inject(MatDialog);
    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(): void {
        if (this.socketService.getGameRoom().organizerId === this.playerService.getPlayer().id) {
            this.socketService.endDebugMode(this.socketService.getGameRoom().accessCode);
        }
        this.socketService.quitGame(this.socketService.getGameRoom().accessCode, this.playerService.getPlayer().id);
    }

    @HostListener('window:pageshow', ['$event'])
    async onPageShow(): Promise<void> {
        this.warning(this.quitGameMessage);
    }

    ngOnInit(): void {
        const myPlayerId = this.playerService.getPlayer().id;

        if (myPlayerId) {
            this.socketService.readyUp(this.gameService.getAccessCode(), myPlayerId);
        }

        this.fightLogicService.fightStarted.subscribe((show) => {
            this.showFightInterface = show;
        });

        this.gameService.isDebugMode.subscribe((isDebugMode) => {
            this.debugMode = isDebugMode;
        });

        this.subscriptions.push(
            this.fightLogicService.fightStarted.subscribe((show) => {
                this.showFightInterface = show;
            }),
            (this.quitGameSubscription = this.gameService.playingPlayers.subscribe((players) => {
                if (players && players.length < 2) {
                    this.warning(this.notEnoughPlayersMessage);
                }
            })),
            this.gameService.isDebugMode.subscribe((isDebugMode) => {
                this.debugMode = isDebugMode;
            }),
        );

        this.socketService.onEndGame().subscribe((winner) => {
            this.warning(`${winner.name} a remporté la partie avec 3 victoires!`);
            timer(this.endGameTimeoutInS).subscribe(async () => this.router.navigate(['/acceuil']));
        });
    }

    ngAfterViewInit(): void {
        const originalAbandonMethod = this.headerBar.getBack;

        this.headerBar.getBack = async () => {
            const confirmed = await this.gameService.confirmAndAbandonGame();
            if (confirmed) {
                if (this.socketService.getGameRoom().organizerId === this.playerService.getPlayer().id) {
                    this.socketService.endDebugMode(this.socketService.getGameRoom().accessCode);
                }
                this.socketService.quitGame(this.socketService.getGameRoom().accessCode, this.socketService.getCurrentPlayerId());
                return originalAbandonMethod.call(this.headerBar);
            }
        };
    }

    toggleInfo() {
        this.showInfo = !this.showInfo;
    }

    toggleChat() {
        this.showChat = !this.showChat;
    }

    ngOnDestroy(): void {
        this.quitGameSubscription.unsubscribe();
        this.socketService.resetSocketState();
    }

    private warning(message: string): void {
        this.openDialog(message, Alert.WARNING).then(() => {
            this.router.navigate(['/acceuil']);
        });
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
