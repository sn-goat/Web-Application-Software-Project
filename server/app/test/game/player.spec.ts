/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Player } from '@app/class/player';
import { Vec2 } from '@common/board';
import { Tile } from '@common/enums';
import {
    ATTACK_ICE_DECREMENT,
    DEFENSE_ICE_DECREMENT,
    DEFAULT_ACTIONS,
    DEFAULT_FLEE_ATTEMPTS,
    DEFAULT_WINS,
    Dice,
    PlayerInput,
    Team,
} from '@common/player';

describe('Player', () => {
    // A basic PlayerInput for testing.
    const basePlayerInput: PlayerInput = {
        name: 'TestPlayer',
        avatar: 'avatar.png',
        life: 100,
        speed: 3,
        attackDice: 'D6' as Dice,
        defenseDice: 'D4' as Dice,
        attackPower: 10,
        defensePower: 5,
    };

    let attacker: Player;
    let defender: Player;

    beforeEach(() => {
        attacker = new Player('attacker-id', basePlayerInput);
        defender = new Player('defender-id', {
            ...basePlayerInput,
            name: 'Defender',
            life: 100,
            attackPower: 8,
            defensePower: 5,
            attackDice: 'D6' as Dice,
            defenseDice: 'D4' as Dice,
        });
    });

    describe('constructor', () => {
        it('should initialize properties correctly', () => {
            expect(attacker.id).toBe('attacker-id');
            expect(attacker.name).toBe('TestPlayer');
            expect(attacker.avatar).toBe('avatar.png');
            expect(attacker.life).toBe(100);
            expect(attacker.speed).toBe(3);
            expect(attacker.attackPower).toBe(10);
            expect(attacker.defensePower).toBe(5);
            expect(attacker.attackDice).toBe('D6');
            expect(attacker.defenseDice).toBe('D4');
            expect(attacker.wins).toBe(DEFAULT_WINS);
            expect(attacker.team).toBeNull();
        });
    });

    describe('attemptFlee', () => {
        beforeEach(() => {
            // Initialize fleeAttempts to a known value.
            attacker.fleeAttempts = 3;
        });

        it('should decrement fleeAttempts and return true when random < fleeThreshold', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.1);
            const result = attacker.attemptFlee();
            expect(result).toBe(true);
            expect(attacker.fleeAttempts).toBe(2);
        });

        it('should decrement fleeAttempts and return false when random >= fleeThreshold', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = attacker.attemptFlee();
            expect(result).toBe(false);
            expect(attacker.fleeAttempts).toBe(2);
        });
    });

    describe('setTeam / getTeam', () => {
        it('should set and get the team correctly using the enum', () => {
            attacker.setTeam(Team.RED);
            expect(attacker.getTeam()).toBe(Team.RED);
        });
    });

    describe('initTurn', () => {
        it('should initialize movement points and actions', () => {
            attacker.speed = 4;
            attacker.initTurn();
            expect(attacker.movementPts).toBe(4);
            expect(attacker.actions).toBe(DEFAULT_ACTIONS);
        });
    });

    describe('initFight', () => {
        it('should initialize fight properties', () => {
            attacker.initFight();
            expect(attacker.fleeAttempts).toBe(DEFAULT_FLEE_ATTEMPTS);
            expect(attacker.currentLife).toBe(attacker.life);
            expect(attacker.diceResult).toBe(0);
        });
    });

    describe('attack', () => {
        beforeEach(() => {
            attacker.initFight();
            defender.initFight();
        });

        it('should calculate damage in debug mode and return false if defender is not defeated', () => {
            // In debug mode:
            // initiateAttack uses diceToNumber for attackDice ('D6' returns 6) so result = 6 + attackPower (10) = 16.
            // initiateDefence uses minDiceValue (1) so result = 1 + defensePower (5) = 6.
            // Damage = 16 - 6 = 10; defender.currentLife becomes 100 - 10 = 90.
            const result = attacker.attack(true, defender);
            expect(defender.currentLife).toBe(90);
            expect(result).toBe(false);
        });

        it('should calculate damage in debug mode and return true when defender is defeated', () => {
            defender.life = 5;
            defender.initFight();
            const result = attacker.attack(true, defender);
            // Damage of 10 defeats the defender: max(5 - 10, 0) = 0.
            expect(defender.currentLife).toBe(0);
            expect(result).toBe(true);
        });

        it('should calculate damage in non-debug mode using random values', () => {
            // For non-debug mode, control Math.random.
            // Attack: 'D6' returns 6. With random 0.5: floor(0.5 * 6) + 1 = 4. Attack result = 4 + 10 = 14.
            // Defence: 'D4' returns 4. With random 0.2: floor(0.2 * 4) + 1 = 1. Defence result = 1 + 5 = 6.
            // Damage = 14 - 6 = 8; defender.currentLife becomes 100 - 8 = 92.
            const randomMock = jest.spyOn(Math, 'random');
            randomMock.mockReturnValueOnce(0.5).mockReturnValueOnce(0.2);
            const result = attacker.attack(false, defender);
            expect(defender.currentLife).toBe(92);
            expect(result).toBe(false);
            randomMock.mockRestore();
        });
    });

    describe('updatePosition', () => {
        it('should update position and reduce powers when field is ICE', () => {
            const initialAttackPower = attacker.attackPower;
            const initialDefensePower = attacker.defensePower;
            const newPos: Vec2 = { x: 5, y: 5 };
            attacker.updatePosition(newPos, Tile.ICE);
            expect(attacker.position).toEqual(newPos);
            expect(attacker.attackPower).toBe(initialAttackPower - ATTACK_ICE_DECREMENT);
            expect(attacker.defensePower).toBe(initialDefensePower - DEFENSE_ICE_DECREMENT);
        });

        it('should update position without reducing powers when field is not ICE', () => {
            const initialAttackPower = attacker.attackPower;
            const initialDefensePower = attacker.defensePower;
            const newPos: Vec2 = { x: 2, y: 3 };
            // Use a different Tile value, for example FLOOR.
            attacker.updatePosition(newPos, Tile.FLOOR);
            expect(attacker.position).toEqual(newPos);
            expect(attacker.attackPower).toBe(initialAttackPower);
            expect(attacker.defensePower).toBe(initialDefensePower);
        });
    });
});
