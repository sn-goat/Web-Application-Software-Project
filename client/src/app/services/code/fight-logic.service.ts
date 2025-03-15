import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from '@app/services/code/socket.service';
import { Avatar, Fight } from '@common/game';
import { GameService } from './game.service';
import { PlayerStats } from '@common/player';
import { Cell } from '@common/board';

@Injectable({
    providedIn: 'root',
})
export class FightLogicService {
    fight: BehaviorSubject<Fight> = new BehaviorSubject<Fight>({} as Fight);
    fightStarted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private socketService = inject(SocketService);
    private gameService = inject(GameService);

    constructor() {
        this.socketService.onFightInit().subscribe((data) => {
            this.fight.next(data);
            this.fightStarted.next(true);
        });
        this.socketService.onSwitchTurn().subscribe((data) => {
            const newCurrentPlayer = data;
            const newFight = { ...this.fight.value, currentPlayer: newCurrentPlayer };
            this.fight.next(newFight);
        });
    }

    getOpponent(): PlayerStats {
        return this.fight.value.player1.id === this.gameService.getClientId() ? this.fight.value.player2 : this.fight.value.player1;
    }

    isAttackProvocation(cell: Cell): boolean {
        return cell.player !== undefined && cell.player !== Avatar.Default;
    }
}
