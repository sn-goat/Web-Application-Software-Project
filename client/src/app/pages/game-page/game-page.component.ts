import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild, inject, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderBarComponent } from '@app/components/common/header-bar/header-bar.component';
import { GameFightInterfaceComponent } from '@app/components/game/game-fight-interface/game-fight-interface.component';
import { GameMapInfoComponent } from '@app/components/game/game-map-info/game-map-info.component';
import { GameMapPlayerDetailedComponent } from '@app/components/game/game-map-player-detailed/game-map-player-detailed.component';
import { GameMapPlayerToolsComponent } from '@app/components/game/game-map-player-tools/game-map-player-tools.component';
import { GameMapPlayerComponent } from '@app/components/game/game-map-player/game-map-player.component';
import { GameMapComponent } from '@app/components/game/game-map/game-map.component';
import { FightLogicService } from '@app/services/code/fight-logic.service';
import { GameService } from '@app/services/code/game.service';
import { PlayerService } from '@app/services/code/player.service';
import { SocketService } from '@app/services/code/socket.service';
import { Game } from '@common/game';
import { PlayerStats } from '@common/player';
import { firstValueFrom } from 'rxjs';
import { AlertComponent } from '@app/components/common/alert/alert.component';
import { MatDialog } from '@angular/material/dialog';
import { Alert } from '@app/constants/enums';

@Component({
    selector: 'app-game-page',
    imports: [
        GameMapComponent,
        GameMapInfoComponent,
        GameMapPlayerDetailedComponent,
        GameMapPlayerToolsComponent,
        GameMapPlayerComponent,
        HeaderBarComponent,
        GameFightInterfaceComponent,
        CommonModule,
    ],
    templateUrl: './game-page.component.html',
    styleUrl: './game-page.component.scss',
})
export class GamePageComponent implements OnInit, AfterViewInit {
    @ViewChild(HeaderBarComponent) headerBar!: HeaderBarComponent;

    showFightInterface: boolean = false;

    private gameService = inject(GameService);
    private fightLogicService = inject(FightLogicService);
    private playerService = inject(PlayerService);
    private socketService = inject(SocketService);
    private router = inject(Router);
    private readonly dialog = inject(MatDialog);
    private currentPlayerId: string | undefined;
    private currentPlayerTurnId: string | undefined;

    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(): void {
        this.socketService.quitGame(this.socketService.getGameRoom().accessCode, this.socketService.getCurrentPlayerId());
    }

    @HostListener('window:pageshow', ['$event'])
    async onPageShow(): Promise<void> {
        await this.warning("Vous avez été déconnecté de la partie, vous allez être redirigé vers la page d'accueil.");
    }

    ngOnInit(): void {
        const myPlayerId = this.playerService.getPlayer().id;

        if (myPlayerId) {
            this.socketService.readyUp(this.gameService.getAccessCode(), myPlayerId);
        }
        this.fightLogicService.fightStarted.subscribe((show) => {
            this.showFightInterface = show;
        });
        this.socketService.onQuitGame().subscribe((game: { game: Game; lastPlayer: PlayerStats }) => {
            this.socketService.onQuitRoomGame().subscribe(async (players: PlayerStats[]) => {
                if (!game.game.players.length && !players.length && game.lastPlayer.id === this.currentPlayerId) {
                    await this.warning("Il n'y a plus de joueurs dans la partie, vous allez être redirigé vers la page d'accueil.");
                }
            });
        });
    }

    ngAfterViewInit(): void {
        const originalAbandonMethod = this.headerBar.getBack;

        this.headerBar.getBack = async () => {
            const confirmed = await this.gameService.confirmAndAbandonGame();
            if (confirmed) {
                this.socketService.quitGame(this.socketService.getGameRoom().accessCode, this.socketService.getCurrentPlayerId());
                return originalAbandonMethod.call(this.headerBar);
            }
        };
    }

    async warning(message: string): Promise<void> {
        await this.openDialog(message, Alert.WARNING);
        this.router.navigate(['/home']).then(() => window.location.reload());
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
