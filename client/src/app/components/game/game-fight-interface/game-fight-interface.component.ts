import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FightLogicService } from '@app/services/fight-logic/fight-logic.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { IPlayer } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-fight-interface',
    imports: [CommonModule, MatButtonModule],
    templateUrl: './game-fight-interface.component.html',
    styleUrl: './game-fight-interface.component.scss',
})
export class GameFightInterfaceComponent implements OnInit, OnDestroy {
    readonly perCent = 100;
    timer: string = '00 s';
    currentNameTurn: string = '';
    myPlayer: IPlayer | null;
    opponentPlayer: IPlayer | null;
    lifePercentMyPlayer: number;
    lifePercentOpponent: number;
    flee: () => void;
    attack: () => void;
    private readonly fightLogicService = inject(FightLogicService);
    private readonly playerService = inject(PlayerService);
    private readonly socketReceiver: SocketReceiverService = inject(SocketReceiverService);
    private subscriptions: Subscription[] = [];

    ngOnInit() {
        this.subscriptions.push(
            this.fightLogicService.fight.subscribe((fight) => {
                const isMyPlayer = fight.player1.id === this.playerService.getPlayer().id;
                this.myPlayer = isMyPlayer ? fight.player1 : fight.player2;
                this.opponentPlayer = !isMyPlayer ? fight.player1 : fight.player2;
                this.currentNameTurn = fight.currentPlayer.name;
                this.lifePercentMyPlayer = Math.floor(((this.myPlayer?.currentLife ?? 0) / (this.myPlayer?.life ?? 1)) * this.perCent);
                this.lifePercentOpponent = Math.floor(((this.opponentPlayer?.currentLife ?? 0) / (this.opponentPlayer?.life ?? 1)) * this.perCent);
            }),

            this.socketReceiver.onFightTimerUpdate().subscribe((remainingTime) => {
                this.timer = `${remainingTime.toString()} s`;
            }),
        );
        this.flee = this.fightLogicService.flee.bind(this.fightLogicService);
        this.attack = this.fightLogicService.attack.bind(this.fightLogicService);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    isMyTurn(): boolean {
        return this.currentNameTurn === this.playerService.getPlayer().name;
    }
}
