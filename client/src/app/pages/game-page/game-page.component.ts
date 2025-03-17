import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { HeaderBarComponent } from '@app/components/common/header-bar/header-bar.component';
import { GameMapInfoComponent } from '@app/components/game/game-map-info/game-map-info.component';
import { GameMapPlayerDetailedComponent } from '@app/components/game/game-map-player-detailed/game-map-player-detailed.component';
import { GameMapPlayerToolsComponent } from '@app/components/game/game-map-player-tools/game-map-player-tools.component';
import { GameMapPlayerComponent } from '@app/components/game/game-map-player/game-map-player.component';
import { GameMapComponent } from '@app/components/game/game-map/game-map.component';
import { FightLogicService } from '@app/services/code/fight-logic.service';
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
        CommonModule,
    ],
    templateUrl: './game-page.component.html',
    styleUrl: './game-page.component.scss',
})
export class GamePageComponent implements OnInit, AfterViewInit {
    @ViewChild(HeaderBarComponent) headerBar!: HeaderBarComponent;

    showFightInterface: boolean = false;
    showChat = false;
    showInfo = false;

    private gameService = inject(GameService);
    private fightLogicService = inject(FightLogicService);
    private playerService = inject(PlayerService);
    private socketService = inject(SocketService);

    ngOnInit(): void {
        const myPlayerId = this.playerService.getPlayer().id;

        if (myPlayerId) {
            this.socketService.readyUp(this.gameService.getAccessCode(), myPlayerId);
        }
        this.fightLogicService.fightStarted.subscribe((show) => {
            this.showFightInterface = show;
        });

        this.gameService.showInfo.subscribe((show) => {
            this.showInfo = show;
        });
    }

    ngAfterViewInit(): void {
        const originalAbandonMethod = this.headerBar.getBack;

        this.headerBar.getBack = async () => {
            const confirmed = await this.gameService.confirmAndAbandonGame();
            if (confirmed) {
                return originalAbandonMethod.call(this.headerBar);
            }
        };
    }

    toggleChat() {
        this.showChat = !this.showChat;
    }

    toggleInfo() {
        this.gameService.toggleInfo();
    }
}
