/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { FightService } from '@app/services/fight.service';
import { TimerService } from '@app/services/timer/timer.service';
import { Fight, FightInfo } from '@common/game';
import { FightEvents } from '@common/game.gateway.events';
import { PlayerStats } from '@common/player';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

describe('FightService', () => {
    let fightService: FightService;
    let timerService: Partial<TimerService>;
    let eventEmitter: Partial<EventEmitter2>;

    beforeEach(async () => {
        timerService = {
            startTimer: jest.fn(),
            stopTimer: jest.fn(),
            resumeTimer: jest.fn(),
            getRemainingTime: jest.fn(),
        };

        eventEmitter = {
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [FightService, { provide: TimerService, useValue: timerService }, { provide: EventEmitter2, useValue: eventEmitter }],
        }).compile();

        fightService = module.get<FightService>(FightService);
    });

    describe('getFight', () => {
        it('should return null if the fight is not found', () => {
            expect(fightService.getFight('inexistant')).toBeNull();
        });

        it('should return the fight if it exists', () => {
            fightService['activeFights'].set('room1', {} as Fight);
            expect(fightService.getFight('room1')).toBeDefined();
        });
    });

    describe('initFight', () => {
        it('should create and initialize a fight', () => {
            const player1: PlayerStats = {
                id: 'p1',
                name: 'Alice',
                speed: 10,
                fleeAttempts: 2,
                currentLife: undefined,
                diceResult: 0,
            } as PlayerStats & FightInfo;
            const player2: PlayerStats = {
                id: 'p2',
                name: 'Bob',
                speed: 5,
                fleeAttempts: 2,
                currentLife: undefined,
                diceResult: 0,
            } as PlayerStats & FightInfo;
            fightService.initFight('roomFight', player1, player2);

            const fight = fightService.getFight('roomFight');
            expect(fight).toBeDefined();
            expect(fight?.currentPlayer).toEqual(player1);
            expect(eventEmitter.emit).toHaveBeenCalledWith(FightEvents.Init, fight);
            expect(timerService.startTimer).toHaveBeenCalledWith('roomFight', expect.any(Number), 'combat');
        });
    });

    describe('nextTurn', () => {
        it('should log an error if the fight is not found', () => {
            const loggerErrorSpy = jest.spyOn(fightService['logger'], 'error').mockImplementation();

            fightService.nextTurn('absent');
            expect(loggerErrorSpy).toHaveBeenCalledWith('Aucun combat actif pour accessCode absent');

            loggerErrorSpy.mockRestore();
        });

        it('should switch player, emit SwitchTurn and restart the timer', () => {
            const fight: Fight = {
                player1: { id: 'p1', name: 'Alice' } as PlayerStats & FightInfo,
                player2: { id: 'p2', name: 'Bob' } as PlayerStats & FightInfo,
                currentPlayer: { id: 'p1', name: 'Alice' } as PlayerStats & FightInfo,
            };
            fightService['activeFights'].set('roomTurn', fight);

            fightService.nextTurn('roomTurn');
            expect(fight.currentPlayer.id).toBe('p2');
            expect(eventEmitter.emit).toHaveBeenCalledWith(FightEvents.SwitchTurn, 'roomTurn');
            expect(timerService.startTimer).toHaveBeenCalledWith('roomTurn', expect.any(Number), 'combat');
        });
    });

    describe('playerFlee', () => {
        it('should log an error if the fight is not found', () => {
            const loggerErrorSpy = jest.spyOn(fightService['logger'], 'error').mockImplementation();
            fightService.playerFlee('noRoom');
            expect(loggerErrorSpy).toHaveBeenCalledWith('Aucun combat actif pour accessCode noRoom');
            loggerErrorSpy.mockRestore();
        });

        it('should call endFight and remove the fight if flee is successful', () => {
            jest.spyOn(global.Math, 'random').mockReturnValue(0.2); // Successful flee (< 0.3)
            const endFightSpy = jest.spyOn(fightService, 'endFight');
            fightService['activeFights'].set('roomFlee', { currentPlayer: { id: 'pA', name: 'Fleeing' } } as Fight);

            fightService.playerFlee('roomFlee');
            expect(endFightSpy).toHaveBeenCalledWith('roomFlee');
            expect(fightService.getFight('roomFlee')).toBeNull();
            jest.spyOn(global.Math, 'random').mockRestore();
        });

        it('should call nextTurn if the flee attempt fails', () => {
            jest.spyOn(global.Math, 'random').mockReturnValue(0.5); // Failed flee
            const nextTurnSpy = jest.spyOn(fightService, 'nextTurn');
            fightService['activeFights'].set('roomFleeFail', {
                currentPlayer: { id: 'pA', name: 'FleeFail' } as PlayerStats,
                player1: { id: 'pA', name: 'FleeFail' } as PlayerStats,
                player2: { id: 'pB', name: 'FleeFail2' } as PlayerStats,
            } as Fight);
            fightService.playerFlee('roomFleeFail');
            expect(nextTurnSpy).toHaveBeenCalledWith('roomFleeFail');
            jest.spyOn(global.Math, 'random').mockRestore();
        });
    });

    describe('endFight', () => {
        it('should emit FightEvents.End and remove the fight', () => {
            fightService['activeFights'].set('roomEnd', {} as Fight);
            fightService.endFight('roomEnd', { id: 'p1' } as PlayerStats, { id: 'p2' } as PlayerStats);
            expect(eventEmitter.emit).toHaveBeenCalledWith(FightEvents.End, {
                accessCode: 'roomEnd',
                winner: { id: 'p1' },
                loser: { id: 'p2' },
            });
            expect(fightService.getFight('roomEnd')).toBeNull();
        });
    });

    describe('playerAttack', () => {
        it('should log an error if the fight is not found', () => {
            const loggerErrorSpy = jest.spyOn(fightService['logger'], 'error').mockImplementation();
            fightService.playerAttack('missingFight');
            expect(loggerErrorSpy).toHaveBeenCalledWith('Aucun combat actif pour accessCode missingFight');
            loggerErrorSpy.mockRestore();
        });

        it('should inflict damage and change turn if the defender is not defeated', () => {
            const attacker = { id: 'p1', attack: 2, attackDice: 'D4', name: 'Attacker' } as PlayerStats & FightInfo;
            const defender = { id: 'p2', defense: 1, defenseDice: 'D4', currentLife: 10, name: 'Defender' } as PlayerStats & FightInfo;
            const fight: Fight = { player1: attacker, player2: defender, currentPlayer: attacker };
            fightService['activeFights'].set('roomAttack', fight);

            // Force dice roll
            jest.spyOn(global.Math, 'random').mockReturnValue(0); // dice = 1
            const nextTurnSpy = jest.spyOn(fightService, 'nextTurn');
            fightService.playerAttack('roomAttack');

            // Calculated damage = (2 + 1) - (1 + 1) => 1
            expect(defender.currentLife).toBe(9);
            expect(nextTurnSpy).toHaveBeenCalledWith('roomAttack');
            jest.spyOn(global.Math, 'random').mockRestore();
        });

        it('should call endFight if the defender is defeated', () => {
            const attacker = { id: 'p1', attack: 5, attackDice: 'D6' } as PlayerStats & FightInfo;
            const defender = { id: 'p2', defense: 1, defenseDice: 'D4', currentLife: 2 } as PlayerStats & FightInfo;
            const fight: Fight = { player1: attacker, player2: defender, currentPlayer: attacker };
            fightService['activeFights'].set('roomKO', fight);

            jest.spyOn(global.Math, 'random').mockReturnValue(0); // force roll = 1
            const endFightSpy = jest.spyOn(fightService, 'endFight');
            fightService.playerAttack('roomKO');

            // Damage = (5+1) - (1+1) = 4 => 2 - 4 = 0 => KO
            expect(endFightSpy).toHaveBeenCalledWith('roomKO', attacker, defender);
            jest.spyOn(global.Math, 'random').mockRestore();
        });

        it('should not inflict negative damage (damage = 0 if calculation < 0)', () => {
            // Assume a very weak attacker and a very resistant defender
            const attacker = { id: 'pA', attack: 4, attackDice: 'D4', name: 'Attacker' } as PlayerStats & FightInfo;
            const defender = { id: 'pB', defense: 10, defenseDice: 'D4', life: 4, name: 'Defender' } as PlayerStats & FightInfo;
            const fight: Fight = { player1: attacker, player2: defender, currentPlayer: attacker };
            fightService['activeFights'].set('roomNegativeDamage', fight);

            jest.spyOn(global.Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);

            fightService.playerAttack('roomNegativeDamage');
            expect(defender.life).toBe(4);

            jest.spyOn(global.Math, 'random').mockRestore();
        });
    });
});
