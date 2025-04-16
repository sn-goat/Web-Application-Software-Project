/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable max-params */
/* eslint-disable max-lines */
import { Fight } from '@app/class/fight';
import { Player } from '@app/class/player';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Fight', () => {
    let fight: Fight;
    let fakeEmitter: EventEmitter2;

    // Create stub players implementing the necessary properties and methods.
    let player1: Player;
    let player2: Player;

    beforeEach(() => {
        // Create a fake emitter.
        fakeEmitter = { emit: jest.fn() } as unknown as EventEmitter2;

        // Create stub players.
        // We'll add only the properties and methods needed by Fight.
        player1 = {
            id: 'p1',
            speed: 10,
            wins: 0,
            currentLife: 100,
            life: 100,
            pearlUsed: false,
            // For attack, we'll simulate a mock function.
            attack: jest.fn(),
            attemptFlee: jest.fn(),
            hasItem: jest.fn().mockReturnValue(false), // Add the missing hasItem method
            getDamage: jest.fn().mockReturnValue(10), // Ajout de la méthode getDamage manquante
        } as unknown as Player;

        player2 = {
            id: 'p2',
            speed: 5,
            wins: 0,
            losses: 0,
            currentLife: 100,
            life: 100,
            pearlUsed: false,
            attack: jest.fn(),
            attemptFlee: jest.fn(),
            hasItem: jest.fn().mockReturnValue(false),
        } as unknown as Player;

        fight = new Fight(fakeEmitter);
    });

    describe('initFight', () => {
        it('should initialize fight and set currentPlayer to player1 when player1.speed >= player2.speed', () => {
            fight.initFight(player1, player2);
            expect(fight.hasFight()).toBe(true);
            expect(fight.player1).toBe(player1);
            expect(fight.player2).toBe(player2);
            expect(fight.currentPlayer).toBe(player1);
        });
    });

    describe('getFighter', () => {
        beforeEach(() => {
            fight.initFight(player1, player2);
        });

        it('should return player1 when player1 id is provided', () => {
            const fighter = fight.getFighter('p1');
            expect(fighter).toBe(player1);
        });

        it('should return player2 when player2 id is provided', () => {
            const fighter = fight.getFighter('p2');
            expect(fighter).toBe(player2);
        });
    });

    describe('getOpponent', () => {
        beforeEach(() => {
            fight.initFight(player1, player2);
        });

        it('should return player2 when player1 id is provided', () => {
            const opponent = fight.getOpponent('p1');
            expect(opponent).toBe(player2);
        });

        it('should return player1 when player2 id is provided', () => {
            const opponent = fight.getOpponent('p2');
            expect(opponent).toBe(player1);
        });
    });

    describe('changeFighter', () => {
        beforeEach(() => {
            fight.initFight(player1, player2);
        });

        it('should change currentPlayer from player1 to player2', () => {
            fight.currentPlayer = player1;
            fight.changeFighter();
            expect(fight.currentPlayer).toBe(player2);
        });

        it('should change currentPlayer from player2 to player1', () => {
            fight.currentPlayer = player2;
            fight.changeFighter();
            expect(fight.currentPlayer).toBe(player1);
        });
    });

    describe('flee', () => {
        beforeEach(() => {
            fight.initFight(player1, player2);
            fight.currentPlayer = player1;
        });

        it('should call attemptFlee on currentPlayer', () => {
            fight.flee();
            expect(player1.attemptFlee).toHaveBeenCalled();
        });

        it('should dispatch journal entry for flee attempt', () => {
            const spy = jest.spyOn(fight, 'dispatchJournalEntry');
            fight.flee();
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('playerAttack', () => {
        beforeEach(() => {
            fight.initFight(player1, player2);
            fight.currentPlayer = player1;
        });

        it('should call attack on currentPlayer', () => {
            fight.playerAttack(false);
            expect(player1.attack).toHaveBeenCalledWith(false, player2);
        });

        it('should return null when defender is not dead', () => {
            (player1.attack as jest.Mock).mockReturnValue(false);
            const result = fight.playerAttack(false);
            expect(result).toBeNull();
        });

        it('should return fight result when defender is dead and has no pearl', () => {
            (player1.attack as jest.Mock).mockReturnValue(true);
            const result = fight.playerAttack(false);
            expect(result).toEqual({
                type: 'decisive',
                winner: player1,
                loser: player2,
            });
        });

        it('should use pearl and not end fight when defender has unused pearl', () => {
            (player1.attack as jest.Mock).mockReturnValue(true);
            (player2.hasItem as jest.Mock).mockReturnValue(true);
            player2.pearlUsed = false;

            const result = fight.playerAttack(false);

            expect(result).toBeNull();
            expect(player2.pearlUsed).toBe(true);
            expect(player2.currentLife).toBe(50); // Half of 100
        });
    });

    describe('isPlayerInFight', () => {
        beforeEach(() => {
            fight.initFight(player1, player2);
        });

        it('should return true when player is part of the fight', () => {
            expect(fight.isPlayerInFight('p1')).toBe(true);
            expect(fight.isPlayerInFight('p2')).toBe(true);
        });

        it('should return false when player is not part of the fight', () => {
            expect(fight.isPlayerInFight('p3')).toBe(false);
        });
    });

    describe('handleFightRemoval', () => {
        beforeEach(() => {
            fight.initFight(player1, player2);
        });

        it('should increment winner wins and call endFight with appropriate result', () => {
            const endFightSpy = jest.spyOn(fight, 'endFight');

            fight.handleFightRemoval('p1');

            expect(player2.wins).toBe(1);
            expect(endFightSpy).toHaveBeenCalledWith({
                type: 'decisive',
                winner: player2,
                loser: player1,
            });
        });
    });

    it('should set currentPlayer to player2 when player1.speed < player2.speed', () => {
        player1.speed = 4;
        player2.speed = 6;
        fight.initFight(player1, player2);
        expect(fight.currentPlayer).toBe(player2);
    });
});
