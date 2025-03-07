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

    private name1: string;
    private name2: string;
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

        this.name1 = '';
        this.name2 = '';
    }

    getName1(): string {
        return this.name1;
    }

    getName2(): string {
        return this.name2;
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

    setFleeAttempt(data: { name: string; value: number }): void {
        if (data.name === this.name1) {
            this.fleeAttempt1.next(data.value);
        } else {
            this.fleeAttempt2.next(data.value);
        }
    }

    flee(name: string): void {
        if (name === this.name1) {
            // to be implemented with socket
        } else {
            // to be implemented with socket
        }
        // to be implemented with socket
    }

    startFight(name1: string, name2: string) {
        if (name1 && name2) {
            this.name1 = name1;
            this.name2 = name2;
            const player1 = this.playerService.getPlayer(name1);
            const player2 = this.playerService.getPlayer(name2);
            if (player1 && player2) {
                this.fightStarted.next(true); // test
                this.setTurn('mockPlayer'); // test

                // to be implemented with socket
            }
        }
    }

    endFight(name1: string, name2: string): void {
        if (this.name1 !== name1 || this.name2 !== name2) {
            return;
        }
        this.name1 = '';
        this.name2 = '';
        // to be implemented with socket
    }

    attack(name: string): void {
        if (name === this.name1) {
            // to be implemented with socket
        } else {
            // to be implemented with socket
        }
        // to be implemented with socket
    }
}
