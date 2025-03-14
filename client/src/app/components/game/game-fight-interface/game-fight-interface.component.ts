import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_AVATARS } from '@app/constants/path';
import { FightLogicService } from '@app/services/code/fight-logic.service';
import { GameService } from '@app/services/code/game.service';
import { PlayerService } from '@app/services/code/player.service';
import { SocketService } from '@app/services/code/socket.service';
import { PlayerStats } from '@common/player';
import { Subject, takeUntil } from 'rxjs';

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
    fleeAttempt2: number = 2;

    private destroy$ = new Subject<void>();
    private fightLogicService = inject(FightLogicService);
    private playerService = inject(PlayerService);
    private gameService = inject(GameService);
    private socketService = inject(SocketService);

    ngOnInit(): void {
        // this.fightLogicService.timer$.pipe(takeUntil(this.destroy$)).subscribe((time) => (this.timer = time));
        this.socketService.onTimerUpdate().subscribe((time: { remainingTime: number }) => {
            this.timer = time.remainingTime.toString();
        });

        this.fightLogicService.d4$.pipe(takeUntil(this.destroy$)).subscribe((value) => (this.diceD4 = value));
        this.fightLogicService.d6$.pipe(takeUntil(this.destroy$)).subscribe((value) => (this.diceD6 = value));

        this.fightLogicService.turn$.pipe(takeUntil(this.destroy$)).subscribe((name) => {
            this.currentTurn = name;
        });

        this.fightLogicService.fleeAttempt1$.pipe(takeUntil(this.destroy$)).subscribe((attempts) => (this.fleeAttempt1 = attempts));
        this.fightLogicService.fleeAttempt2$.pipe(takeUntil(this.destroy$)).subscribe((attempts) => (this.fleeAttempt2 = attempts));

        this.gameService.activePlayer$.subscribe((player) => {
            this.player1 = player;
        });
        this.gameService.defender$.subscribe((player) => {
            this.player2 = player;
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    isMyTurn(): boolean {
        return this.currentTurn === this.playerService.getPlayerName();
    }

    flee(): void {
        if (this.isMyTurn()) {
            this.fightLogicService.flee(this.playerService.getPlayerName());
        }
    }

    attack(): void {
        if (this.isMyTurn()) {
            this.fightLogicService.attack(this.playerService.getPlayerName());
        }
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
