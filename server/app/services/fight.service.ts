import { FIGHT_TURN_DURATION_IN_S } from '@app/gateways/game/game.gateway.constants';
import { TimerService } from '@app/services/timer/timer.service';
import { Fight } from '@common/game';
import { FightEvents } from '@common/game.gateway.events';
import { Dice, PlayerStats } from '@common/player';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FightService {
    private readonly fleeThreshold = 0.3;
    private readonly dice4 = 4;
    private readonly dice6 = 6;
    private logger: Logger = new Logger(FightService.name);
    private activeFights: Map<string, Fight> = new Map();

    constructor(
        private timerService: TimerService,
        private eventEmitter: EventEmitter2,
    ) {}
    getFight(accessCode: string): Fight | null {
        return this.activeFights.get(accessCode) ?? null;
    }

    initFight(accessCode: string, player1: PlayerStats, player2: PlayerStats) {
        this.timerService.pauseTimer(accessCode);
        this.logger.log(`Init fight between ${player1.id} and ${player2.id}`);
        const currentPlayer = player1.speed >= player2.speed ? player1 : player2;
        const newFight: Fight = { player1, player2, currentPlayer };
        this.activeFights.set(accessCode, newFight);
        this.eventEmitter.emit(FightEvents.Init, newFight);
        this.timerService.startTimer(accessCode, FIGHT_TURN_DURATION_IN_S, 'combat');
    }

    nextTurn(accessCode: string) {
        const fight = this.activeFights.get(accessCode);
        if (!fight) {
            this.logger.error(`Aucun combat actif pour accessCode ${accessCode}`);
            return;
        }
        this.switchPlayer(fight);
        this.eventEmitter.emit(FightEvents.SwitchTurn, accessCode);
        this.timerService.startTimer(accessCode, FIGHT_TURN_DURATION_IN_S, 'combat');
    }

    playerFlee(accessCode: string) {
        const fight = this.activeFights.get(accessCode);
        if (!fight) {
            this.logger.error(`Aucun combat actif pour accessCode ${accessCode}`);
            return;
        }
        const fleeSuccess = Math.random() < this.fleeThreshold;
        if (fleeSuccess) {
            this.logger.log(`Player ${fight.currentPlayer.name} a réussi à fuir le combat pour accessCode ${accessCode}`);
            this.endFight(accessCode);
            this.activeFights.delete(accessCode);
        } else {
            this.nextTurn(accessCode);
            this.logger.log(`Le joueur ${fight.currentPlayer.name} a échoué à fuir le combat pour accessCode ${accessCode}`);
        }
    }

    endFight(accessCode: string, winner?: PlayerStats, loser?: PlayerStats) {
        this.eventEmitter.emit(FightEvents.End, { accessCode, winner, loser });
        this.activeFights.delete(accessCode);
    }

    playerAttack(accessCode: string) {
        const fight = this.activeFights.get(accessCode);
        if (!fight) {
            this.logger.error(`Aucun combat actif pour accessCode ${accessCode}`);
            return;
        }
        const attacker: PlayerStats = fight.currentPlayer;
        const defender: PlayerStats = fight.player1.id === attacker.id ? fight.player2 : fight.player1;
        const attackDiceValue = Math.floor(Math.random() * this.diceToNumber(attacker.attackDice)) + 1;
        const defenseDiceValue = Math.floor(Math.random() * this.diceToNumber(defender.defenseDice)) + 1;

        let damage = attacker.attack + attackDiceValue - (defender.defense + defenseDiceValue);
        if (damage < 0) {
            damage = 0;
        }

        defender.life = Math.max((defender.life || 0) - damage, 0);
        this.logger.log(`Player ${attacker.id} attaque ${defender.id} et inflige ${damage} points de dégâts (vie restante: ${defender.life}).`);

        if (defender.life === 0) {
            this.endFight(accessCode, attacker, defender);
        } else {
            this.nextTurn(accessCode);
        }
    }

    private switchPlayer(fight: Fight) {
        fight.currentPlayer = fight.currentPlayer.id === fight.player1.id ? fight.player2 : fight.player1;
    }

    private diceToNumber(dice: Dice): number {
        return dice === 'D6' ? this.dice6 : this.dice4;
    }
}
