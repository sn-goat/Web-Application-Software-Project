import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
// import { SocketService } from '@app/services/code/socket.service';
import { PlayerService } from './player.service';

@Injectable({
    providedIn: 'root',
})
export class FightLogicService {
    d4$: Observable<number>;
    d6$: Observable<number>;
    timer$: Observable<string>;
    turn$: Observable<string>;
    fleeAttempt1$: Observable<number>;
    fleeAttempt2$: Observable<number>;
    fightStarted$: Observable<boolean>;

    private username1: string;
    private username2: string;
    // private socketService: SocketService = inject(SocketService);
    private playerService: PlayerService = inject(PlayerService);

    private d4: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private d6: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private timer: BehaviorSubject<string> = new BehaviorSubject<string>('00:00');
    private turn: BehaviorSubject<string> = new BehaviorSubject<string>('');
    private fleeAttempt1: BehaviorSubject<number> = new BehaviorSubject<number>(2);
    private fleeAttempt2: BehaviorSubject<number> = new BehaviorSubject<number>(2);
    private fightStarted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor() {
        this.d4$ = this.d4.asObservable();
        this.d6$ = this.d6.asObservable();
        this.timer$ = this.timer.asObservable();
        this.turn$ = this.turn.asObservable();
        this.fleeAttempt1$ = this.fleeAttempt1.asObservable();
        this.fleeAttempt2$ = this.fleeAttempt2.asObservable();
        this.fightStarted$ = this.fightStarted.asObservable();

        this.username1 = '';
        this.username2 = '';
    }

    getUsername1(): string {
        return this.username1;
    }

    getUsername2(): string {
        return this.username2;
    }

    rollDiceD4(value: number): void {
        this.d4.next(value);
    }

    rollDiceD6(value: number): void {
        this.d6.next(value);
    }

    setTimer(value: string): void {
        this.timer.next(value);
        // to be implemented with socket
    }

    setTurn(value: string): void {
        this.turn.next(value);
    }

    setFleeAttempt(data: { username: string; value: number }): void {
        if (data.username === this.username1) {
            this.fleeAttempt1.next(data.value);
        } else {
            this.fleeAttempt2.next(data.value);
        }
    }

    flee(username: string): void {
        if (username === this.username1) {
            // to be implemented with socket
        } else {
            // to be implemented with socket
        }
        // to be implemented with socket
    }

    startFight(username1: string, username2: string) {
        if (username1 && username2) {
            this.username1 = username1;
            this.username2 = username2;
            const player1 = this.playerService.getPlayer(username1);
            const player2 = this.playerService.getPlayer(username2);
            if (player1 && player2) {
                // to be implemented with socket
            }
        }
    }

    endFight(username1: string, username2: string): void {
        if (this.username1 !== username1 || this.username2 !== username2) {
            return;
        }
        this.username1 = '';
        this.username2 = '';
        // to be implemented with socket
    }

    attack(username: string): void {
        if (username === this.username1) {
            // to be implemented with socket
        } else {
            // to be implemented with socket
        }
        // to be implemented with socket
    }
}
