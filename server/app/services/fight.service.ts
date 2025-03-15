import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FIGHT_TURN_DURATION_IN_S, THREE_SECONDS_IN_MS } from '@app/gateways/game/game.gateway.constants';
import { Fight } from '@common/game';
import { FightEvents } from '@common/game.gateway.events';
import { Dice, PlayerStats } from '@common/player';
import { TimerService } from '@app/services/timer/timer.service';

@Injectable()
export class FightService {
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
        this.eventEmitter.emit(FightEvents.SwitchTurn, { accessCode, currentPlayer });
        setTimeout(() => {
            this.logger.log(`Starting timer for accessCode ${accessCode}`);
            this.timerService.startTimer(accessCode, FIGHT_TURN_DURATION_IN_S, 'combat');
        }, THREE_SECONDS_IN_MS);
    }

    nextTurn(accessCode: string) {
        const fight = this.activeFights.get(accessCode);
        if (!fight) {
            this.logger.error(`Aucun combat actif pour accessCode ${accessCode}`);
            return;
        }
        this.switchPlayer(fight);
        this.eventEmitter.emit(FightEvents.SwitchTurn, { accessCode, currentPlayer: fight.currentPlayer });
        setTimeout(() => {
            this.timerService.startTimer(accessCode, FIGHT_TURN_DURATION_IN_S, 'combat');
        }, THREE_SECONDS_IN_MS);
    }

    playerFlee(accessCode: string, playerId: string) {
        const fight = this.activeFights.get(accessCode);
        if (!fight) {
            this.logger.error(`Aucun combat actif pour accessCode ${accessCode}`);
            return;
        }
        if (this.getFighterById(fight, playerId)) {
            this.logger.error(`Le joueur ${playerId} n'est pas participant dans le combat pour accessCode ${accessCode}`);
            return;
        }
        const fleeThreshold = 0.3;
        const fleeSuccess = Math.random() < fleeThreshold;
        if (fleeSuccess) {
            this.logger.log(`Player ${playerId} a réussi à fuir le combat pour accessCode ${accessCode}`);
            this.activeFights.delete(accessCode);
        } else {
            this.logger.log(`Le joueur ${playerId} a échoué à fuir le combat pour accessCode ${accessCode}`);
        }
    }

    endFight(accessCode: string, winner: PlayerStats | null) {
        this.activeFights.delete(accessCode);
        this.eventEmitter.emit(FightEvents.End, { accessCode, winner });
    }

    playerAttack(accessCode: string, playerId: string) {
        const fight = this.activeFights.get(accessCode);
        if (!fight) {
            this.logger.error(`Aucun combat actif pour accessCode ${accessCode}`);
            return;
        }
        const attacker: PlayerStats = this.getFighterById(fight, playerId);
        if (!attacker) {
            this.logger.error(`Le joueur ${playerId} n'est pas participant dans le combat pour accessCode ${accessCode}`);
            return;
        }
        const defender: PlayerStats = fight.player1.id === playerId ? fight.player2 : fight.player1;

        const attackDiceValue = Math.floor(Math.random() * this.diceToNumber(attacker.attackDice)) + 1;
        const defenseDiceValue = Math.floor(Math.random() * this.diceToNumber(defender.defenseDice)) + 1;

        let damage = attacker.attack + attackDiceValue - (defender.defense + defenseDiceValue);
        if (damage < 0) {
            damage = 0;
        }

        defender.life = Math.max((defender.life || 0) - damage, 0);
        this.logger.log(`Player ${attacker.id} attaque ${defender.id} et inflige ${damage} points de dégâts (vie restante: ${defender.life}).`);

        if (defender.life === 0) {
            this.logger.log(`Player ${defender.id} est mort.`);
            this.activeFights.delete(accessCode);
        }
    }

    private switchPlayer(fight: Fight) {
        fight.currentPlayer = fight.currentPlayer.id === fight.player1.id ? fight.player2 : fight.player1;
    }

    private getFighterById(fight: Fight, playerId: string): PlayerStats | null {
        if (fight.player1.id === playerId) {
            return fight.player1;
        }
        if (fight.player2.id === playerId) {
            return fight.player2;
        }
        return null;
    }

    private diceToNumber(dice: Dice): number {
        const die4 = 4;
        const die6 = 6;
        switch (dice) {
            case 'D6':
                return die6;
            case 'D4':
                return die4;
            default:
                return 0;
        }
    }
}
