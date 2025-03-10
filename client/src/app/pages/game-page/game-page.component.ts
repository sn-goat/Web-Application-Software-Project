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
import { GameService } from '@app/services/code/game.service';
import { PlayerService } from '@app/services/code/player.service';
import { SocketService } from '@app/services/code/socket.service';

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
    private playerService = inject(PlayerService);
    private socketService = inject(SocketService);
    private router = inject(Router);
    private currentPlayerId: string | undefined;

    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(): void {
        this.socketService.disconnect(this.socketService.getGameRoom().accessCode, this.socketService.getCurrentPlayerId());
        this.socketService.quitGame(this.socketService.getGameRoom().accessCode, this.socketService.getCurrentPlayerId());
    }

    @HostListener('window:pageshow', ['$event'])
    onPageShow(): void {
        this.router.navigate(['/home']).then(() => window.location.reload());
    }
    // private currentPlayerTurnId: string | undefined;

    ngOnInit(): void {
        this.gameService.showFightInterface$.subscribe((show) => {
            this.showFightInterface = show;
        });
        this.gameService.clientPlayer$.subscribe((player) => {
            this.currentPlayerId = player?.id;
        });
        // this.socketService.onTurnUpdate().subscribe((playerId: { playerTurnId: string }) => {
        //     this.currentPlayerTurnId = playerId.playerTurnId;
        //     // eslint-disable-next-line no-console
        //     // console.log(this.currentPlayerTurnId);
        // });

        if (this.currentPlayerId) {
            this.socketService.readyUp(this.gameService.getAccessCode(), this.currentPlayerId);
        }
    }

    ngAfterViewInit(): void {
        const originalAbandonMethod = this.headerBar.getBack;

        this.headerBar.getBack = async () => {
            const confirmed = await this.gameService.confirmAndAbandonGame(this.playerService.getPlayerName());
            if (confirmed) {
                this.socketService.disconnect(this.socketService.getGameRoom().accessCode, this.socketService.getCurrentPlayerId());
                this.socketService.quitGame(this.socketService.getGameRoom().accessCode, this.socketService.getCurrentPlayerId());
                return originalAbandonMethod.call(this.headerBar);
            }
        };
    }
}
