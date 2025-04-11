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
        } as unknown as Player;

        player2 = {
            id: 'p2',
            speed: 5,
            wins: 0,
            currentLife: 100,
            life: 100,
            pearlUsed: false,
            attack: jest.fn(),
            attemptFlee: jest.fn(),
            hasItem: jest.fn().mockReturnValue(false), // Add the missing hasItem method
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

        it('should set currentPlayer to player2 when player1.speed < player2.speed', () => {
            player1.speed = 4;
            player2.speed = 6;
            fight.initFight(player1, player2);
            expect(fight.currentPlayer).toBe(player2);
        });
    });

    describe('getFighter and getOpponent', () => {
        beforeEach(() => {
            fight.initFight(player1, player2);
        });

        it('getFighter should return player1 if given player1.id', () => {
            const fighter = fight.getFighter('p1');
            expect(fighter).toBe(player1);
        });

        it('getFighter should return player2 if given player2.id', () => {
            const fighter = fight.getFighter('p2');
            expect(fighter).toBe(player2);
        });

        it('getOpponent should return player2 when given player1.id', () => {
            const opponent = fight.getOpponent('p1');
            expect(opponent).toBe(player2);
        });

        it('getOpponent should return player1 when given player2.id', () => {
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
        });

        it('should return the result of currentPlayer.attemptFlee (true)', () => {
            (fight.currentPlayer.attemptFlee as jest.Mock).mockReturnValue(true);
            const result = fight.flee();
            expect(result).toBe(true);
            expect(fight.currentPlayer.attemptFlee).toHaveBeenCalled();
        });

        it('should return the result of currentPlayer.attemptFlee (false)', () => {
            (fight.currentPlayer.attemptFlee as jest.Mock).mockReturnValue(false);
            const result = fight.flee();
            expect(result).toBe(false);
            expect(fight.currentPlayer.attemptFlee).toHaveBeenCalled();
        });
    });

    describe('playerAttack', () => {
        beforeEach(() => {
            fight.initFight(player1, player2);
            // Ensure both players are set for a fight.
            // For these tests, currentPlayer will be player1 if speeds are equal or higher.
            fight.currentPlayer = player1;
        });

        it('should not declare a winner when defender has a pearl', () => {
            // Mock the player having the pearl and not having used it yet
            (player2.hasItem as jest.Mock).mockReturnValue(true);
            player2.pearlUsed = false;
            player2.life = 100;

            // Simulate attack killing the defender
            (player1.attack as jest.Mock).mockReturnValue(true);

            const result = fight.playerAttack(false);

            // Pearl should be used to save the player
            expect(player2.pearlUsed).toBe(true);
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(player2.currentLife).toBe(50); // Math.floor(100/2)
            expect(result).toBeNull(); // No winner/loser yet
        });

        it('should increment wins and return winner/loser when attack kills the opponent (debug mode)', () => {
            // Simulate attack returning true (defender dead).
            (player1.attack as jest.Mock).mockReturnValue(true);
            const result = fight.playerAttack(true);
            // Expect attack to be called with debug mode and defender (player2).
            expect(player1.attack).toHaveBeenCalledWith(true, player2);
            expect(result).toEqual({ winner: player1, loser: player2 });
            // Verify that player1's wins incremented.
            expect(player1.wins).toBe(1);
        });

        it('should return null when attack does not kill the opponent', () => {
            // Simulate attack returning false.
            (player1.attack as jest.Mock).mockReturnValue(false);
            const result = fight.playerAttack(true);
            expect(player1.attack).toHaveBeenCalledWith(true, player2);
            expect(result).toBeNull();
        });
    });

    describe('hasFight', () => {
        it('should return false before fight is initiated', () => {
            expect(fight.hasFight()).toBe(false);
        });

        it('should return true after fight is initiated', () => {
            fight.initFight(player1, player2);
            expect(fight.hasFight()).toBe(true);
        });
    });

    describe('isPlayerInFight', () => {
        beforeEach(() => {
            fight.initFight(player1, player2);
        });

        it('should return true if given player id is player1', () => {
            expect(fight.isPlayerInFight('p1')).toBe(true);
        });

        it('should return true if given player id is player2', () => {
            expect(fight.isPlayerInFight('p2')).toBe(true);
        });

        it('should return false for an id not in the fight', () => {
            expect(fight.isPlayerInFight('unknown')).toBe(false);
        });
    });

    describe('handleFightRemoval', () => {
        beforeEach(() => {
            fight.initFight(player1, player2);
            // Set wins to known values.
            player1.wins = 0;
            player2.wins = 0;
        });

        it('should return the correct winner and loser when player1 is removed', () => {
            const result = fight.handleFightRemoval('p1');
            // When player1 is removed, the opponent is player2.
            expect(result).toEqual({ winner: player2, loser: player1 });
            expect(player2.wins).toBe(1);
        });

        it('should return the correct winner and loser when player2 is removed', () => {
            const result = fight.handleFightRemoval('p2');
            // When player2 is removed, the opponent is player1.
            expect(result).toEqual({ winner: player1, loser: player2 });
            expect(player1.wins).toBe(1);
        });
    });
});
