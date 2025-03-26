import { Player } from '@app/class/player';
import { IFight } from '@common/game';
import { EventEmitter2 } from '@nestjs/event-emitter';

export class Fight implements IFight {
    player1: Player;
    player2: Player;
    currentPlayer: Player;
    private hasFightStarted: boolean;
    private internalEmitter: EventEmitter2;

    private readonly fleeThreshold = 0.3;

    constructor(internalEmitter: EventEmitter2) {
        this.internalEmitter = internalEmitter;
        this.hasFightStarted = false;
    }

    initFight(player1: Player, player2: Player): void {
        this.hasFightStarted = true;
        this.player1 = player1;
        this.player2 = player2;
        this.currentPlayer = player1.speed >= player2.speed ? player1 : player2;
    }

    getFighter(playerId: string): Player {
        return this.player1.id === playerId ? this.player1 : this.player2;
    }

    getOpponent(playerId: string): Player {
        return this.player1.id === playerId ? this.player2 : this.player1;
    }

    changeFighter(): void {
        this.currentPlayer = this.currentPlayer.id === this.player1.id ? this.player2 : this.player1;
    }

    flee() {
        return this.currentPlayer.attemptFlee();
    }

    playerAttack(isDebugMode: boolean): { winner: Player; loser: Player } | null {
        const attacker = this.currentPlayer;
        const defender = this.getOpponent(this.currentPlayer.id);
        const isDefenderDead = attacker.attack(isDebugMode, defender);
        if (isDefenderDead) {
            attacker.wins += 1;
            return { winner: attacker, loser: defender };
        }
        return null;
    }

    hasFight(): boolean {
        return this.hasFightStarted;
    }
}
