import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { GameService } from '@app/services/game/game.service';
import { IPlayer } from '@common/player';
import { Item } from '@common/enums';
import { Subscription } from 'rxjs';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';

@Component({
    selector: 'app-game-map-player',
    imports: [CommonModule],
    templateUrl: './game-map-player.component.html',
    styleUrl: './game-map-player.component.scss',
})
export class GameMapPlayerComponent implements OnInit, OnDestroy, AfterViewInit {
    players: IPlayer[] = [];
    activePlayer: IPlayer | null;
    flagOwner: IPlayer | null = null;
    getOrganizerId: () => string;
    private playersInGame: IPlayer[];
    private readonly gameService: GameService = inject(GameService);
    private readonly socketReceiver: SocketReceiverService = inject(SocketReceiverService);
    private subscriptions: Subscription[] = [];

    ngOnInit() {
        this.subscriptions.push(
            this.gameService.playingPlayers.subscribe((gamePlayers: IPlayer[]) => {
                this.playersInGame = gamePlayers;
            }),

            this.gameService.initialPlayers.subscribe((gamePlayers: IPlayer[]) => {
                this.players = gamePlayers;
            }),

            this.gameService.activePlayer.subscribe((player: IPlayer | null) => {
                this.activePlayer = player;
            }),

            this.socketReceiver.onItemCollected().subscribe((data) => {
                for (const items of data.player.inventory) {
                    if (items === Item.Flag) {
                        this.flagOwner = data.player;
                    }
                }
            }),

            this.socketReceiver.onItemDropped().subscribe((data) => {
                for (const items of data.droppedItems) {
                    if (items.item === Item.Flag) {
                        this.flagOwner = null;
                    }
                }
            }),
        );
        this.getOrganizerId = this.gameService.getOrganizerId.bind(this.gameService);
    }

    ngAfterViewInit(): void {
        this.players = this.playersInGame;
    }

    playerIsInGame(player: IPlayer): boolean {
        return player && this.playersInGame.some((playerInGame) => playerInGame.id === player.id);
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        this.subscriptions = [];
    }
}
