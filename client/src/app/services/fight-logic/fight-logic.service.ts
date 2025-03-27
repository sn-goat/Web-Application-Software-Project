import { Injectable, inject } from '@angular/core';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { Cell } from '@common/board';
import { Avatar, IFight } from '@common/game';
import { IPlayer } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';

@Injectable({
    providedIn: 'root',
})
export class FightLogicService {
    fight: BehaviorSubject<IFight> = new BehaviorSubject<IFight>({} as IFight);
    fightStarted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private readonly socketReceiver: SocketReceiverService = inject(SocketReceiverService);
    private readonly socketEmitter: SocketEmitterService = inject(SocketEmitterService);
    private gameService = inject(GameService);
    private playerService = inject(PlayerService);

    constructor() {
        this.socketReceiver.onFightInit().subscribe((fight: IFight) => {
            this.fight.next(fight);
            this.fightStarted.next(true);
        });
        this.socketReceiver.onFighterTurnChanged().subscribe((fight: IFight) => {
            this.fight.next(fight);
        });
        this.socketReceiver.onEndFight().subscribe(() => {
            this.endFight();
        });
    }

    getOpponent(): IPlayer {
        return this.fight.value.player1.id === this.playerService.getPlayer().id ? this.fight.value.player2 : this.fight.value.player1;
    }

    isAttackProvocation(cell: Cell): boolean {
        return cell.player !== undefined && cell.player !== Avatar.Default;
    }

    flee(): void {
        this.socketEmitter.flee();
    }

    attack(): void {
        this.socketEmitter.attack();
    }

    endFight(): void {
        this.fight.next({} as IFight);
        this.fightStarted.next(false);
        this.gameService.isActionSelected.next(false);
    }
}
