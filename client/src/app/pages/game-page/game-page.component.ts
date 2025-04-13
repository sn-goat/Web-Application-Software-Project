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
import { ItemPopupComponent } from '@app/components/game/item-popup/item-popup.component';
import { PopupComponent } from '@app/components/popup/popup.component';
import { Alert } from '@app/constants/enums';
import { FightLogicService } from '@app/services/fight-logic/fight-logic.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { PopupService } from '@app/services/popup/popup.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { Vec2 } from '@common/board';
import { Item } from '@common/enums';
import { IPlayer } from '@common/player';
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
        PopupComponent,
    ],
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(HeaderBarComponent) headerBar!: HeaderBarComponent;

    showFightInterface: boolean = false;
    showChat = false;
    showInfo = false;
    debugMode = false;
    popupVisible = false;

    private readonly endGameTimeoutInS = 5000;
    private subscriptions: Subscription[] = [];
    private gameService = inject(GameService);
    private fightLogicService = inject(FightLogicService);
    private readonly playerService = inject(PlayerService);
    private readonly socketEmitter = inject(SocketEmitterService);
    private readonly socketReceiver = inject(SocketReceiverService);
    private router = inject(Router);
    private readonly popupService = inject(PopupService);

    private readonly dialog = inject(MatDialog);
    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(): void {
        this.socketEmitter.disconnect(this.playerService.getPlayer().id);
    }

    ngOnInit(): void {
        const myPlayerId = this.playerService.getPlayer().id;

        if (myPlayerId) {
            this.socketEmitter.ready(myPlayerId);
        }
        this.subscriptions.push(
            this.fightLogicService.fightStarted.subscribe((show) => {
                this.showFightInterface = show;
            }),

            this.gameService.isDebugMode.subscribe((isDebugMode) => {
                this.debugMode = isDebugMode;
            }),

            this.fightLogicService.fightStarted.subscribe((show) => {
                this.showFightInterface = show;
            }),

            this.gameService.isDebugMode.subscribe((isDebugMode) => {
                this.debugMode = isDebugMode;
            }),

            this.socketReceiver.onPlayerRemoved().subscribe((message: string) => {
                this.warning(message);
            }),

            this.socketReceiver.onGameWinner().subscribe((winner) => {
                this.warningEndGame(`${winner.name} a remporté la partie avec 3 victoires!`);
                if (winner.team) {
                    this.warningEndGame(`${winner.name} a rapporté le drapeau à son point de départ. L'équipe ${winner.team} remporte la partie`);
                } else {
                    this.warningEndGame(`${winner.name} a remporté la partie avec 3 victoires!`);
                }
                timer(this.endGameTimeoutInS).subscribe(async () => this.router.navigate(['/stats']));
            }),

            this.socketReceiver.onInventoryFull().subscribe((payload: { player: IPlayer; item: Item; position: Vec2 }) => {
                const localPlayer = this.playerService.getPlayer();
                if (localPlayer && payload && payload.player && payload.player.id === localPlayer.id) {
                    this.dialog.open(ItemPopupComponent, {
                        data: {
                            inventory: [...payload.player.inventory, payload.item],
                            collectedPosition: payload.position,
                        },
                        disableClose: true,
                        width: '500px',
                        height: '500px',
                    });
                }
            }),
        );
    }

    ngAfterViewInit(): void {
        const originalAbandonMethod = this.headerBar.getBack;

        this.headerBar.getBack = async () => {
            const confirmed = await this.gameService.confirmAndAbandonGame();
            if (confirmed) {
                this.socketEmitter.disconnect(this.playerService.getPlayer().id);
                return originalAbandonMethod.call(this.headerBar);
            }
        };
    }

    toggleInfo() {
        this.showInfo = !this.showInfo;
    }

    toggleChat() {
        this.popupVisible = !this.popupVisible;
        this.popupService.setPopupVisible(this.popupVisible);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((s) => s.unsubscribe());
    }

    private warning(message: string): void {
        this.openDialog(message, Alert.WARNING).then(() => {
            this.router.navigate(['/acceuil']);
        });
    }

    private warningEndGame(message: string): void {
        this.openDialog(message, Alert.WARNING);
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
