import { FIGHT_TURN_DURATION_IN_S } from '@app/gateways/game/game.gateway.constants';
import { GameService } from '@app/services/game/game.service';
import { TimerService } from '@app/services/timer/timer.service';
import { Fight, FightInfo } from '@common/game';
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

    getFighter(accessCode: string, playerId: string): (PlayerStats & FightInfo) | null {
        const fight = this.getFight(accessCode);
        if (!fight) {
            return null;
        }
        return fight.player1.id === playerId ? fight.player1 : fight.player2;
    }

    getOpponent(accessCode: string, playerId: string): (PlayerStats & FightInfo) | null {
        const fight = this.getFight(accessCode);
        const firstPlayer = this.getFighter(accessCode, playerId);
        if (!fight || !firstPlayer) {
            return null;
        }
        return firstPlayer.id === fight.player1.id ? fight.player2 : fight.player1;
    }

    initFight(accessCode: string, player1: PlayerStats, player2: PlayerStats) {
        this.logger.log(`Init fight between ${player1.name} and ${player2.name}`);
        const player1Info = { ...player1, fleeAttempts: 2, currentLife: player1.life, diceResult: 0 };
        const player2Info = { ...player2, fleeAttempts: 2, currentLife: player2.life, diceResult: 0 };
        const currentPlayer = player1.speed >= player2.speed ? player1Info : player2Info;
        const newFight: Fight = { player1: player1Info, player2: player2Info, currentPlayer };
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
            this.decrementFleeCount(fight);
            this.nextTurn(accessCode);
            this.logger.log(`Le joueur ${fight.currentPlayer.name} a échoué à fuir le combat pour accessCode ${accessCode}`);
        }
    }

    endFight(accessCode: string, winner?: PlayerStats, loser?: PlayerStats) {
        this.eventEmitter.emit(FightEvents.End, { accessCode, winner, loser });
        this.activeFights.delete(accessCode);
    }

    playerAttack(accessCode: string, isDebugMode: boolean) {
        const fight = this.activeFights.get(accessCode);
        if (!fight) {
            this.logger.error(`Aucun combat actif pour accessCode ${accessCode}`);
            return;
        }
        const attacker: PlayerStats & FightInfo = fight.currentPlayer.id === fight.player1.id ? fight.player1 : fight.player2;
        const defender: PlayerStats & FightInfo = fight.player1.id === attacker.id ? fight.player2 : fight.player1;

        if (!isDebugMode) {
            attacker.diceResult = Math.floor(Math.random() * this.diceToNumber(attacker.attackDice)) + 1;
            defender.diceResult = Math.floor(Math.random() * this.diceToNumber(defender.defenseDice)) + 1;
        } else {
            attacker.diceResult = this.diceToNumber(attacker.attackDice);
            defender.diceResult = this.diceToNumber(defender.defenseDice);
        }

        let damage = attacker.attack + attacker.diceResult - (defender.defense + defender.diceResult);
        if (damage < 0) {
            damage = 0;
        }

        defender.currentLife = Math.max(defender.currentLife - damage, 0);
        this.logger.log(`Player ${attacker.name} attaque ${defender.name} et inflige ${damage} points de dégâts (vie restante: ${defender.life}).`);

        if (defender.currentLife === 0) {
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

    private decrementFleeCount(fight: Fight) {
        fight.currentPlayer.fleeAttempts--;
    }
}
