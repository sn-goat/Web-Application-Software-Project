/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { JournalManager } from '@app/class/journal-manager';
import { Item } from '@common/enums';
import { GameMessage, ITEM_TO_NAME } from '@common/journal';

describe('JournalManager', () => {
    class MockPlayer {
        name: string;
        id: string;
        diceResult: number;
        damage: number;

        constructor(name: string, id: string, diceResult: number = 0, damage: number = 0) {
            this.name = name;
            this.id = id;
            this.diceResult = diceResult;
            this.damage = damage;
        }

        getDamage(): number {
            return this.damage;
        }
    }

    describe('processEntry', () => {
        it('should create entry for PickItem message', () => {
            const player = new MockPlayer('Test Player', 'player-id');
            const item = Item.Sword;

            const entry = JournalManager.processEntry(GameMessage.PickItem, [player as any], item);

            expect(entry).toBeDefined();
            expect(entry.isFight).toBe(false);
            expect(entry.message).toBe(`${GameMessage.PickItem} ${ITEM_TO_NAME[item]} par ${player.name}`);
            expect(entry.playersInvolved).toEqual([player.id]);
        });

        it('should throw error for invalid item in PickItem message', () => {
            const player = new MockPlayer('Test Player', 'player-id');

            expect(() => {
                JournalManager.processEntry(GameMessage.PickItem, [player as any], 'oui' as Item);
            }).toThrow('Item oui does not exist');
        });

        it('should create entry for AttackDiceResult message', () => {
            const player = new MockPlayer('Test Player', 'player-id', 5);

            const entry = JournalManager.processEntry(GameMessage.AttackDiceResult, [player as any]);

            expect(entry).toBeDefined();
            expect(entry.isFight).toBe(true);
            expect(entry.message).toBe(`${GameMessage.AttackDiceResult} ${player.name} : ${player.diceResult}`);
            expect(entry.playersInvolved).toEqual([player.id]);
        });

        it('should create entry for DefenseDiceResult message', () => {
            const player = new MockPlayer('Test Player', 'player-id', 3);

            const entry = JournalManager.processEntry(GameMessage.DefenseDiceResult, [player as any]);

            expect(entry).toBeDefined();
            expect(entry.isFight).toBe(true);
            expect(entry.message).toBe(`${GameMessage.DefenseDiceResult} ${player.name} : ${player.diceResult}`);
            expect(entry.playersInvolved).toEqual([player.id]);
        });

        it('should create entry for DamageResult message', () => {
            const attacker = new MockPlayer('Attacker', 'attacker-id', 0, 10);
            const defender = new MockPlayer('Defender', 'defender-id');

            const entry = JournalManager.processEntry(GameMessage.DamageResult, [attacker as any, defender as any]);

            expect(entry).toBeDefined();
            expect(entry.isFight).toBe(true);
            expect(entry.message).toBe(`${attacker.name} ${GameMessage.DamageResult} ${attacker.damage} points de dégats à ${defender.name}`);
            expect(entry.playersInvolved).toEqual([attacker.id, defender.id]);
        });

        it('should create entry for FleeAttempt message', () => {
            const player = new MockPlayer('Test Player', 'player-id');

            const entry = JournalManager.processEntry(GameMessage.FleeAttempt, [player as any]);

            expect(entry).toBeDefined();
            expect(entry.isFight).toBe(true);
            expect(entry.message).toBe(`${GameMessage.FleeAttempt} ${player.name}`);
            expect(entry.playersInvolved).toEqual([player.id]);
        });

        it('should create entry for FleeSuccess message', () => {
            const player = new MockPlayer('Test Player', 'player-id');

            const entry = JournalManager.processEntry(GameMessage.FleeSuccess, [player as any]);

            expect(entry).toBeDefined();
            expect(entry.isFight).toBe(true);
            expect(entry.message).toBe(`${GameMessage.FleeSuccess} ${player.name}`);
            expect(entry.playersInvolved).toEqual([player.id]);
        });

        it('should create entry for FleeFailure message', () => {
            const player = new MockPlayer('Test Player', 'player-id');

            const entry = JournalManager.processEntry(GameMessage.FleeFailure, [player as any]);

            expect(entry).toBeDefined();
            expect(entry.isFight).toBe(true);
            expect(entry.message).toBe(`${GameMessage.FleeFailure} ${player.name}`);
            expect(entry.playersInvolved).toEqual([player.id]);
        });

        it('should create entry for EndGame message', () => {
            const players = ['Player1', 'Player2', 'Player3'];

            const entry = JournalManager.processEntry(GameMessage.EndGame, players as any);

            expect(entry).toBeDefined();
            expect(entry.isFight).toBe(false);
            expect(entry.message).toContain(`${GameMessage.EndGame} ${players[0]}`);
            expect(entry.message).toContain('Les joueurs actifs sont :');
            expect(entry.message).toContain(players.join(',\n'));
        });

        it('should create entry for AttackInit message (as a fight message)', () => {
            const attacker = new MockPlayer('Attacker', 'attacker-id');
            const defender = new MockPlayer('Defender', 'defender-id');

            const entry = JournalManager.processEntry(GameMessage.AttackInit, [attacker as any, defender as any]);

            expect(entry).toBeDefined();
            expect(entry.isFight).toBe(true);
            expect(entry.message).toBe(`${GameMessage.AttackInit} ${attacker.name} et ${defender.name}`);
            expect(entry.playersInvolved).toEqual([attacker.id, defender.id]);
        });

        it('should create entry for other messages with one player', () => {
            const player = new MockPlayer('Test Player', 'player-id');
            const customMessage = 'Custom message';

            const entry = JournalManager.processEntry(customMessage as GameMessage, [player as any]);

            expect(entry).toBeDefined();
            expect(entry.isFight).toBe(false);
            expect(entry.message).toBe(`${customMessage} ${player.name}`);
            expect(entry.playersInvolved).toEqual([player.id]);
        });

        it('should create entry for other messages with multiple players', () => {
            const player1 = new MockPlayer('Player One', 'player1-id');
            const player2 = new MockPlayer('Player Two', 'player2-id');
            const customMessage = 'Custom message';

            const entry = JournalManager.processEntry(customMessage as GameMessage, [player1 as any, player2 as any]);

            expect(entry).toBeDefined();
            expect(entry.isFight).toBe(false);
            expect(entry.message).toBe(`${customMessage} ${player1.name} et ${player2.name}`);
            expect(entry.playersInvolved).toEqual([player1.id, player2.id]);
        });
    });
});
