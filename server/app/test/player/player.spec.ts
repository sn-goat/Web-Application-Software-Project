/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Player } from '@app/class/player';
import { Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { DEFAULT_ACTIONS, DEFAULT_FLEE_ATTEMPTS, DEFAULT_WINS, Dice, PlayerInput, Team } from '@common/player';

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
            expect(attacker.tilesVisited).toEqual(new Set<Vec2>());
            expect(attacker.itemsPicked).toEqual(new Set<Item>());
            expect(attacker.takenDamage).toBe(0);
            expect(attacker.givenDamage).toBe(0);
            expect(attacker.losses).toBe(0);
            expect(attacker.fleeSuccess).toBe(0);
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
            attacker.setTeam(Team.Red);
            expect(attacker.getTeam()).toBe(Team.Red);
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

        it('should get the current damage', () => {
            attacker.attack(true, defender);
            expect(attacker.getDamage()).toBeGreaterThanOrEqual(0);
        });
    });

    describe('updatePosition', () => {
        it('should update position without reducing powers when field is not Ice', () => {
            const initialAttackPower = attacker.attackPower;
            const initialDefensePower = attacker.defensePower;
            const newPos: Vec2 = { x: 2, y: 3 };
            // Use a different Tile value, for example Floor.
            attacker.updatePosition(newPos, Tile.Floor);
            expect(attacker.position).toEqual(newPos);
            expect(attacker.attackPower).toBe(initialAttackPower);
            expect(attacker.defensePower).toBe(initialDefensePower);
        });
    });

    describe("Gestion de l'inventaire", () => {
        describe('addItemToInventory', () => {
            it("devrait ajouter un item à l'inventaire et retourner true quand l'inventaire n'est pas plein", () => {
                expect(attacker.inventory.length).toBe(0);
                const result = attacker.addItemToInventory(Item.Bow);

                expect(result).toBe(true);
                expect(attacker.inventory).toContain(Item.Bow);
                expect(attacker.inventory.length).toBe(1);
            });

            it("devrait retourner false quand l'inventaire est plein", () => {
                // Remplir l'inventaire
                attacker.addItemToInventory(Item.Bow);
                attacker.addItemToInventory(Item.Shield);

                // Tenter d'ajouter un troisième item
                const result = attacker.addItemToInventory(Item.Sword);

                expect(result).toBe(false);
                expect(attacker.inventory).not.toContain(Item.Sword);
                expect(attacker.inventory.length).toBe(2);
            });

            it('devrait augmenter attackPower et réduire defensePower quand Sword est ajouté', () => {
                const initialAttackPower = attacker.attackPower;
                const initialDefensePower = attacker.defensePower;

                attacker.addItemToInventory(Item.Sword);

                expect(attacker.attackPower).toBe(initialAttackPower + 1);
                expect(attacker.defensePower).toBe(initialDefensePower - 1);
            });

            it('devrait augmenter defensePower et réduire speed quand Shield est ajouté', () => {
                const initialDefensePower = attacker.defensePower;
                const initialSpeed = attacker.speed;

                attacker.addItemToInventory(Item.Shield);

                expect(attacker.defensePower).toBe(initialDefensePower + 2);
                expect(attacker.speed).toBe(initialSpeed - 1);
            });

            it('ne devrait pas modifier les stats quand un autre item est ajouté', () => {
                const initialAttackPower = attacker.attackPower;
                const initialDefensePower = attacker.defensePower;
                const initialSpeed = attacker.speed;

                attacker.addItemToInventory(Item.Bow);

                expect(attacker.attackPower).toBe(initialAttackPower);
                expect(attacker.defensePower).toBe(initialDefensePower);
                expect(attacker.speed).toBe(initialSpeed);
            });
        });

        describe('removeItemFromInventory', () => {
            beforeEach(() => {
                // Initialiser l'inventaire pour les tests de suppression
                attacker.inventory = [Item.Sword, Item.Shield];
                // Ajuster les stats comme si les items avaient été ajoutés normalement
                attacker.attackPower += 1; // Pour Sword
                attacker.defensePower -= 1; // Pour Sword
                attacker.defensePower += 2; // Pour Shield
                attacker.speed -= 1; // Pour Shield
            });

            it("devrait retirer un item de l'inventaire et retourner true quand l'item existe", () => {
                const result = attacker.removeItemFromInventory(Item.Sword);

                expect(result).toBe(true);
                expect(attacker.inventory).not.toContain(Item.Sword);
                expect(attacker.inventory.length).toBe(1);
            });

            it("devrait retourner false quand l'item n'existe pas dans l'inventaire", () => {
                const result = attacker.removeItemFromInventory(Item.Bow);

                expect(result).toBe(false);
                expect(attacker.inventory.length).toBe(2);
            });

            it('devrait réduire attackPower et augmenter defensePower quand Sword est retiré', () => {
                const initialAttackPower = attacker.attackPower;
                const initialDefensePower = attacker.defensePower;

                attacker.removeItemFromInventory(Item.Sword);

                expect(attacker.attackPower).toBe(initialAttackPower - 1);
                expect(attacker.defensePower).toBe(initialDefensePower + 1);
            });

            it('devrait réduire defensePower et augmenter speed quand Shield est retiré', () => {
                const initialDefensePower = attacker.defensePower;
                const initialSpeed = attacker.speed;

                attacker.removeItemFromInventory(Item.Shield);

                expect(attacker.defensePower).toBe(initialDefensePower - 2);
                expect(attacker.speed).toBe(initialSpeed + 1);
            });

            it('ne devrait pas modifier les stats quand un autre item est retiré', () => {
                // D'abord ajouter un item qui n'affecte pas les stats
                attacker.inventory.push(Item.Bow);

                const initialAttackPower = attacker.attackPower;
                const initialDefensePower = attacker.defensePower;
                const initialSpeed = attacker.speed;

                attacker.removeItemFromInventory(Item.Bow);

                expect(attacker.attackPower).toBe(initialAttackPower);
                expect(attacker.defensePower).toBe(initialDefensePower);
                expect(attacker.speed).toBe(initialSpeed);
            });
        });

        describe('hasItem', () => {
            it("devrait retourner true quand le joueur possède l'item", () => {
                attacker.inventory = [Item.Sword, Item.Bow];

                expect(attacker.hasItem(Item.Sword)).toBe(true);
                expect(attacker.hasItem(Item.Bow)).toBe(true);
            });

            it("devrait retourner false quand le joueur ne possède pas l'item", () => {
                attacker.inventory = [Item.Sword];

                expect(attacker.hasItem(Item.Shield)).toBe(false);
                expect(attacker.hasItem(Item.Bow)).toBe(false);
            });

            it("devrait retourner false quand l'inventaire est vide", () => {
                attacker.inventory = [];

                expect(attacker.hasItem(Item.Sword)).toBe(false);
            });
        });

        describe('isCtfWinner', () => {
            it('should return false if the player does not have the flag in its inventory', () => {
                attacker.inventory = [];
                expect(attacker.isCtfWinner()).toBeFalsy();
            });

            it('should return true if the player does have the flag in its inventory but is not positioned on his spawn point', () => {
                attacker.addItemToInventory(Item.Flag);
                attacker.spawnPosition = { x: 2, y: 2 };
                attacker.position = { x: 4, y: 6 };
                expect(attacker.isCtfWinner()).toBeFalsy();
            });

            it('should return true if the player does have the flag and is positioned on his spawn point', () => {
                attacker.addItemToInventory(Item.Flag);
                attacker.spawnPosition = { x: 2, y: 2 };
                attacker.position = { x: 2, y: 2 };
                expect(attacker.isCtfWinner()).toBeTruthy();
            });
        });
    });
});
