import { Injectable, inject } from '@angular/core';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketService } from '@app/services/socket/socket.service';
import { Cell } from '@common/board';
import { Avatar, Fight } from '@common/game';
import { PlayerStats } from '@common/player';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class FightLogicService {
    fight: BehaviorSubject<Fight> = new BehaviorSubject<Fight>({} as Fight);
    fightStarted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private socketService = inject(SocketService);
    private gameService = inject(GameService);
    private playerService = inject(PlayerService);

    constructor() {
        this.socketService.onFightInit().subscribe((data) => {
            this.fight.next(data);
            this.fightStarted.next(true);
        });
        this.socketService.onSwitchTurn().subscribe((data) => {
            this.fight.next(data);
        });
        this.socketService.onEndFight().subscribe(() => {
            this.endFight();
        });

        this.socketService.onWinner().subscribe(() => {
            // console.log('Winner');
        });

        this.socketService.onLoser().subscribe(() => {
            // console.log('Loser');
        });
    }

    getOpponent(): PlayerStats {
        return this.fight.value.player1.id === this.playerService.getPlayer().id ? this.fight.value.player2 : this.fight.value.player1;
    }

    isAttackProvocation(cell: Cell): boolean {
        return cell.player !== undefined && cell.player !== Avatar.Default;
    }

    flee(): void {
        this.socketService.playerFlee(this.gameService.getAccessCode());
    }

    attack(): void {
        this.socketService.playerAttack(this.gameService.getAccessCode());
    }

    endFight(): void {
        this.fight.next({} as Fight);
        this.fightStarted.next(false);
        this.gameService.isActionSelected.next(false);
    }
}
