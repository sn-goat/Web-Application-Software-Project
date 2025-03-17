import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_AVATARS } from '@app/constants/path';
import { FightLogicService } from '@app/services/code/fight-logic.service';
import { PlayerService } from '@app/services/code/player.service';
import { SocketService } from '@app/services/code/socket.service';
import { FightInfo } from '@common/game';
import { PlayerStats } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-fight-interface',
    standalone: true,
    imports: [CommonModule, MatButtonModule],
    templateUrl: './game-fight-interface.component.html',
    styleUrl: './game-fight-interface.component.scss',
})
export class GameFightInterfaceComponent implements OnDestroy {
    readonly srcAvatar: string = DEFAULT_PATH_AVATARS;
    readonly fileType: string = DEFAULT_FILE_TYPE;
    readonly perCent = 100;

    timer: string = '00 s';
    currentNameTurn: string = '';
    myPlayer: (PlayerStats & FightInfo) | null;
    opponentPlayer: (PlayerStats & FightInfo) | null;
    lifePercentMyPlayer: number;
    lifePercentOpponent: number;

    private subscriptions: Subscription[] = [];

    private fightLogicService = inject(FightLogicService);
    private playerService = inject(PlayerService);
    private socketService = inject(SocketService);

    constructor() {
        this.subscriptions.push(
            this.fightLogicService.fight.subscribe((fight) => {
                const isMyPlayer = fight.player1.id === this.playerService.getPlayer().id;
                this.myPlayer = isMyPlayer ? fight.player1 : fight.player2;
                this.opponentPlayer = !isMyPlayer ? fight.player1 : fight.player2;
                this.currentNameTurn = fight.currentPlayer.name;
                this.lifePercentMyPlayer = ((this.myPlayer?.currentLife ?? 0) / (this.myPlayer?.life ?? 1)) * this.perCent;
                this.lifePercentOpponent = ((this.opponentPlayer?.currentLife ?? 0) / (this.opponentPlayer?.life ?? 1)) * this.perCent;
            }),

            this.socketService.onFightTimerUpdate().subscribe((remainingTime) => {
                this.timer = `${remainingTime.toString()} s`;
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    isMyTurn(): boolean {
        return this.currentNameTurn === this.playerService.getPlayer().name;
    }

    flee(): void {
        this.fightLogicService.flee();
    }

    attack(): void {
        this.fightLogicService.attack();
    }
}
