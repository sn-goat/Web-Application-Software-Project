import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_AVATARS } from '@app/constants/path';
import { FightLogicService } from '@app/services/code/fight-logic.service';
import { PlayerService } from '@app/services/code/player.service';
import { SocketService } from '@app/services/code/socket.service';
import { PlayerStats } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-fight-interface',
    standalone: true,
    imports: [CommonModule, MatButtonModule],
    templateUrl: './game-fight-interface.component.html',
    styleUrl: './game-fight-interface.component.scss',
})
export class GameFightInterfaceComponent implements OnInit, OnDestroy {
    readonly srcAvatar: string = DEFAULT_PATH_AVATARS;
    readonly fileType: string = DEFAULT_FILE_TYPE;

    timer: string = '00:00';
    diceD4: number = 0;
    diceD6: number = 0;
    currentTurn: string = '';
    player1: PlayerStats | null;
    player2: PlayerStats | null;
    fleeAttempt1: number = 2;
    fleeAttempt2: number = 1;

    private subscriptions: Subscription[] = [];

    private fightLogicService = inject(FightLogicService);
    private playerService = inject(PlayerService);
    private socketService = inject(SocketService);

    ngOnInit(): void {
        this.subscriptions.push(
            this.fightLogicService.fight.subscribe((fight) => {
                this.player1 = fight.player1;
                this.player2 = fight.player2;
                this.currentTurn = fight.currentPlayer.name;
            }),

            this.socketService.onFightTimerUpdate().subscribe((remainingTime) => {
                this.timer = remainingTime.toString();
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    isMyTurn(): boolean {
        return this.currentTurn === this.playerService.getPlayerName();
    }

    flee(): void {
        // TODO: Implement flee
    }

    attack(): void {
        // TODO: Implement attack
    }

    getFleeAttempts(name: string): number {
        if (this.player1 && name === this.player1.name) {
            return this.fleeAttempt1;
        } else if (this.player2 && name === this.player2.name) {
            return this.fleeAttempt2;
        }
        return 0;
    }
}
