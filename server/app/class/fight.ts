import { Player } from '@app/class/player';
import { FightResult, FightResultType } from '@app/constants/fight-interface';
import { InternalFightEvents, InternalJournalEvents } from '@app/constants/internal-events';
import { Item } from '@common/enums';
import { IFight } from '@common/game';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GameMessage } from '@common/journal';
import { JournalManager } from '@app/class/utils/journal-manager';

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
        this.internalEmitter.emit(InternalFightEvents.Init, this);
    }

    getFighter(playerId: string): Player {
        return this.player1.id === playerId ? this.player1 : this.player2;
    }

    getOpponent(playerId: string): Player {
        return this.player1.id === playerId ? this.player2 : this.player1;
    }

    changeFighter(): void {
        this.currentPlayer = this.currentPlayer.id === this.player1.id ? this.player2 : this.player1;
        this.internalEmitter.emit(InternalFightEvents.ChangeFighter, this);
    }

    flee() {
        this.dispatchJournalEntry(GameMessage.FleeAttempt, [this.currentPlayer, this.getOpponent(this.currentPlayer.id ?? this.currentPlayer.name)]);
        return this.currentPlayer.attemptFlee();
    }

    playerAttack(isDebugMode: boolean): FightResult | null {
        const attacker = this.currentPlayer;
        const defender = this.getOpponent(this.currentPlayer.id);
        const isDefenderDead = attacker.attack(isDebugMode, defender);
        this.dispatchJournalEntry(GameMessage.AttackInit, [attacker, defender]);
        this.dispatchJournalEntry(GameMessage.AttackDiceResult, [attacker, defender]);
        this.dispatchJournalEntry(GameMessage.DefenseDiceResult, [defender, attacker]);
        this.dispatchJournalEntry(GameMessage.DamageResult, [attacker, defender]);
        if (isDefenderDead) {
            if (defender.hasItem(Item.Pearl) && !defender.pearlUsed) {
                defender.pearlUsed = true;
                defender.currentLife = Math.floor(defender.life / 2);
                return null;
            } else {
                defender.losses += 1;
                attacker.wins += 1;
                return { type: FightResultType.Decisive, winner: attacker, loser: defender };
            }
        }
        return null;
    }

    dispatchJournalEntry(messageType: GameMessage, playersInvolved: Player[], item?: Item): void {
        const message = JournalManager.processEntry(messageType, playersInvolved, item);
        if (message) {
            this.internalEmitter.emit(InternalJournalEvents.Add, message);
        }
    }

    hasFight(): boolean {
        return this.hasFightStarted;
    }

    isPlayerInFight(playerId: string): boolean {
        return this.hasFightStarted && (this.player1.id === playerId || this.player2.id === playerId);
    }

    handleFightRemoval(playerId: string): void {
        const winner = this.getOpponent(playerId);
        winner.wins += 1;
        const loser = this.getFighter(playerId);
        const fightResult: FightResult = { type: FightResultType.Decisive, winner, loser };
        this.endFight(fightResult);
    }

    endFight(fightResult: FightResult): void {
        this.hasFightStarted = false;
        this.player1 = undefined;
        this.player2 = undefined;
        this.currentPlayer = undefined;
        this.internalEmitter.emit(InternalFightEvents.End, fightResult);
    }
}
