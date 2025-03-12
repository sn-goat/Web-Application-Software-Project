import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { HeaderBarComponent } from '@app/components/common/header-bar/header-bar.component';
import { GameFightInterfaceComponent } from '@app/components/game/game-fight-interface/game-fight-interface.component';
import { GameMapInfoComponent } from '@app/components/game/game-map-info/game-map-info.component';
import { GameMapPlayerDetailedComponent } from '@app/components/game/game-map-player-detailed/game-map-player-detailed.component';
import { GameMapPlayerToolsComponent } from '@app/components/game/game-map-player-tools/game-map-player-tools.component';
import { GameMapPlayerComponent } from '@app/components/game/game-map-player/game-map-player.component';
import { GameMapComponent } from '@app/components/game/game-map/game-map.component';
import { GameService } from '@app/services/code/game.service';
import { SocketService } from '@app/services/code/socket.service';
import { PlayerService } from '@app/services/code/player.service';
import { Vec2 } from '@common/board';
import { TurnInfo } from '@common/game';

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
    private currentPlayerId: string | undefined;

    ngOnInit(): void {
        this.gameService.showFightInterface$.subscribe((show) => {
            this.showFightInterface = show;
        });
        this.gameService.clientPlayer$.subscribe((player) => {
            this.currentPlayerId = player?.id;
        });

        this.socketService.onTurnSwitch().subscribe((turn: TurnInfo) => {
            this.gameService.updateTurn(turn.player, turn.path);
        });

        if (this.currentPlayerId) {
            this.socketService.readyUp(this.gameService.getAccessCode(), this.currentPlayerId);
        }

        this.socketService.onBroadcastMove().subscribe((payload: { position: Vec2; direction: Vec2 }) => {
            this.gameService.onMove(payload.position, payload.direction);
        });

        this.socketService.onTurnUpdate().subscribe((turn: TurnInfo) => {
            this.gameService.updateTurn(turn.player, turn.path);
        });
    }

    ngAfterViewInit(): void {
        const originalAbandonMethod = this.headerBar.getBack;

        this.headerBar.getBack = async () => {
            const confirmed = await this.gameService.confirmAndAbandonGame(this.playerService.getPlayerName());
            if (confirmed) {
                return originalAbandonMethod.call(this.headerBar);
            }
        };
    }
}
