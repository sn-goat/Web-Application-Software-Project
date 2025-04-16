import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { SubLifecycleHandlerComponent } from '@app/components/common/sub-lifecycle-handler/subscription-lifecycle-handler.component';
import { GameService } from '@app/services/game/game.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { Item } from '@common/enums';
import { IPlayer } from '@common/player';

@Component({
    selector: 'app-game-map-player',
    imports: [CommonModule],
    templateUrl: './game-map-player.component.html',
    styleUrl: './game-map-player.component.scss',
})
export class GameMapPlayerComponent extends SubLifecycleHandlerComponent implements OnInit, AfterViewInit {
    players: IPlayer[] = [];
    activePlayer: IPlayer | null;
    flagOwner: IPlayer | null = null;
    getOrganizerId: () => string;
    private playersInGame: IPlayer[];
    private readonly gameService: GameService = inject(GameService);
    private readonly socketReceiver: SocketReceiverService = inject(SocketReceiverService);

    ngOnInit() {
        this.subscribeToGameService();
        this.subscribeToSocketReceiver();
        this.getOrganizerId = this.gameService.getOrganizerId.bind(this.gameService);
    }

    ngAfterViewInit(): void {
        this.players = this.playersInGame;
    }

    isPlayerInGame(player: IPlayer): boolean {
        return player && this.playersInGame.some((playerInGame) => playerInGame.id === player.id);
    }

    isVirtualPlayer(player: IPlayer): boolean {
        return player.virtualStyle !== undefined;
    }

    private subscribeToGameService() {
        this.autoSubscribe(this.gameService.playingPlayers, (gamePlayers: IPlayer[]) => {
            this.playersInGame = gamePlayers;
        });

        this.autoSubscribe(this.gameService.initialPlayers, (gamePlayers: IPlayer[]) => {
            this.players = gamePlayers;
        });

        this.autoSubscribe(this.gameService.activePlayer, (player: IPlayer | null) => {
            this.activePlayer = player;
        });
    }

    private subscribeToSocketReceiver() {
        this.autoSubscribe(this.socketReceiver.onItemCollected(), (data) => {
            for (const items of data.player.inventory) {
                if (items === Item.Flag) {
                    this.flagOwner = data.player;
                }
            }
        });

        this.autoSubscribe(this.socketReceiver.onItemDropped(), (data) => {
            for (const items of data.droppedItems) {
                if (items.item === Item.Flag) {
                    this.flagOwner = null;
                }
            }
        });
    }
}
