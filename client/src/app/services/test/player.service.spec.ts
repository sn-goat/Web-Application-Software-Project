/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { MAX_PLAYERS } from '@app/constants/playerConst';
import { PlayerService } from '@app/services/code/player.service';
import { Player } from '@common/player';

describe('PlayerService', () => {
    let service: PlayerService;

    const mockPlayers: Player[] = [
        {
            id: '1',
            name: 'player1',
            avatar: '1',
            life: 100,
            attack: 10,
            defense: 10,
            rapidity: 5,
            attackDice: 'd6',
            defenseDice: 'd4',
            movementPts: 5,
            actions: 2,
        },
        {
            id: '2',
            name: 'player2',
            avatar: '2',
            life: 100,
            attack: 10,
            defense: 10,
            rapidity: 10,
            attackDice: 'd6',
            defenseDice: 'd4',
            movementPts: 5,
            actions: 2,
        },
        {
            id: '3',
            name: 'player3',
            avatar: '3',
            life: 100,
            attack: 10,
            defense: 10,
            rapidity: 3,
            attackDice: 'd6',
            defenseDice: 'd4',
            movementPts: 5,
            actions: 2,
        },
    ];

    const getNewPlayers = () => {
        return mockPlayers.map((p) => ({ ...p }));
    };

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PlayerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize with empty values', () => {
        let activePlayer: string | undefined;
        let admin: string | undefined;
        let players: Player[] | undefined;

        service.activePlayer$.subscribe((value) => (activePlayer = value));
        service.admin$.subscribe((value) => (admin = value));
        service.players$.subscribe((value) => (players = value));

        expect(activePlayer).toBe('');
        expect(admin).toBe('');
        expect(players).toEqual([]);
    });

    it('should set active player', () => {
        let activePlayer: string | undefined;
        service.activePlayer$.subscribe((value) => (activePlayer = value));

        service.setActivePlayer('player1');
        expect(activePlayer).toBe('player1');
    });

    it('should set players if count is within limit', () => {
        // Use specific test instances to avoid conflicts
        const testPlayers = [
            {
                id: '1',
                name: 'player1',
                avatar: '1',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 5,
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
            {
                id: '2',
                name: 'player2',
                avatar: '2',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 10,
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
        ];

        service.setPlayers(testPlayers);

        let players: Player[] = [];
        service.players$.subscribe((value) => (players = value));

        expect(players.length).toBe(2);
        // Player2 has higher rapidity, so it should be first
        expect(players[0].name).toBe('player2');
        expect(players[1].name).toBe('player1');
    });

    it('should not set players if count exceeds maximum', () => {
        const manyPlayers: Player[] = [];
        for (let i = 0; i < MAX_PLAYERS + 1; i++) {
            manyPlayers.push({
                ...mockPlayers[0],
                id: `${i}`,
                name: `player${i}`,
            });
        }

        let players: Player[] | undefined;
        service.players$.subscribe((value) => (players = value));

        service.setPlayers(manyPlayers);
        expect(players?.length).toBe(0);
    });

    it('should sort players by rapidity in descending order', () => {
        const testPlayers = [
            {
                id: '1',
                name: 'player1',
                avatar: '1',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 5,
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
            {
                id: '2',
                name: 'player2',
                avatar: '2',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 10, // Highest
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
            {
                id: '3',
                name: 'player3',
                avatar: '3',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 3,
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
        ];

        service.setPlayers(testPlayers);

        let sortedPlayers: Player[] = [];
        service.players$.subscribe((players) => (sortedPlayers = players));

        expect(sortedPlayers[0].name).toBe('player2');
        expect(sortedPlayers[1].name).toBe('player1');
        expect(sortedPlayers[2].name).toBe('player3');
    });

    it('should get player by name', () => {
        const players = [
            {
                id: '1',
                name: 'player1',
                avatar: '1',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 5,
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
            {
                id: '2',
                name: 'player2',
                avatar: '2',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 10,
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
        ];

        service.setPlayers(players);

        const player = service.getPlayer('player2');

        expect(player).toBeTruthy();
        expect(player?.name).toBe('player2');
    });

    it('should return undefined for non-existent player', () => {
        service.setPlayers(mockPlayers);

        const player = service.getPlayer('nonExistent');
        expect(player).toBeUndefined();
    });

    it('should return undefined when getting player with falsy name', () => {
        service.setPlayers(mockPlayers);

        const player = service.getPlayer('');
        expect(player).toBeUndefined();
    });

    it('should edit player when conditions are met', () => {
        const testPlayers = [
            {
                id: '1',
                name: 'player1',
                avatar: '1',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 5,
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
        ];

        service.setPlayers(testPlayers);
        service.setPlayerName('player1');

        const updatedPlayer = {
            ...testPlayers[0],
            life: 80,
            attack: 15,
        };

        service.editPlayer(updatedPlayer);

        const resultPlayer = service.getPlayer('player1');
        expect(resultPlayer?.life).toBe(80);
    });

    it('should not edit player when player is undefined', () => {
        const testPlayers = getNewPlayers();
        service.setPlayers(testPlayers);
        service.setPlayerName('player1');

        const player = service.getPlayer('player1');
        expect(player).toBeTruthy();

        const initialPlayer = player ? { ...player } : undefined;

        service.editPlayer(undefined as unknown as Player);
        const playerAfter = service.getPlayer('player1');
        expect(playerAfter).toEqual(initialPlayer);
    });

    it('should not edit player when player does not exist', () => {
        const testPlayers = [
            {
                id: '1',
                name: 'player1',
                avatar: '1',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 5,
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
        ];

        service.setPlayers(testPlayers);
        service.setPlayerName('player1');

        const nonExistentPlayer: Player = {
            id: '999',
            name: 'nonExistent',
            avatar: '1',
            life: 100,
            attack: 10,
            defense: 10,
            rapidity: 5,
            attackDice: 'd6',
            defenseDice: 'd4',
            movementPts: 5,
            actions: 2,
        };

        service.editPlayer(nonExistentPlayer);

        const player1 = service.getPlayer('player1');
        expect(player1).toBeTruthy();
        expect(player1?.life).toBe(100);

        const nonExistentResult = service.getPlayer('nonExistent');
        expect(nonExistentResult).toBeUndefined();
    });

    it('should not edit player when name does not match playerName', () => {
        service.setPlayers(mockPlayers);
        service.setPlayerName('player3');

        const updatedPlayer: Player = {
            ...mockPlayers[0],
            life: 80,
        };

        service.editPlayer(updatedPlayer);

        const player = service.getPlayer('player1');
        expect(player?.life).toBe(100);
    });

    it('should remove player by name and return true if successful', () => {
        service.setPlayers(mockPlayers);

        const result = service.removePlayerByName('player2');

        expect(result).toBe(true);
        expect(service.getPlayer('player2')).toBeUndefined();
    });

    it('should return false when removing non-existent player by name', () => {
        const freshPlayers = [
            {
                id: '1',
                name: 'player1',
                avatar: '1',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 5,
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
            {
                id: '2',
                name: 'player2',
                avatar: '2',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 10,
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
            {
                id: '3',
                name: 'player3',
                avatar: '3',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 3,
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
        ];

        service.setPlayers(freshPlayers);

        const result = service.removePlayerByName('nonExistent');

        expect(result).toBe(false);

        let players: Player[] = [];
        service.players$.subscribe((value) => (players = value));
        expect(players.length).toBe(3);
    });

    it('should set and get player name', () => {
        service.setPlayerName('myname');
        expect(service.getPlayerName()).toBe('myname');
    });

    it('should set admin', () => {
        let admin: string | undefined;
        service.admin$.subscribe((value) => (admin = value));

        service.setAdmin('adminUser');
        expect(admin).toBe('adminUser');
    });

    it('should add player when conditions are met', () => {
        const initialPlayer = {
            id: '2',
            name: 'player2',
            avatar: '2',
            life: 100,
            attack: 10,
            defense: 10,
            rapidity: 10,
            attackDice: 'd6',
            defenseDice: 'd4',
            movementPts: 5,
            actions: 2,
        };

        service.setPlayers([initialPlayer]);

        const playerToAdd: Player = {
            id: '5',
            name: 'player2',
            avatar: '5',
            life: 90,
            attack: 15,
            defense: 12,
            rapidity: 7,
            attackDice: 'd6',
            defenseDice: 'd4',
            movementPts: 4,
            actions: 3,
        };

        service.addPlayer(playerToAdd);

        let players: Player[] = [];
        service.players$.subscribe((value) => (players = value));

        expect(players.length).toBe(2);

        expect(players.some((p) => p.id === '5')).toBe(true);
    });

    it('should not add player when player is undefined', () => {
        spyOn(console, 'error');

        const initialPlayer = { ...mockPlayers[0] };
        service.setPlayers([initialPlayer]);

        let initialPlayers: Player[] = [];
        service.players$.subscribe((value) => (initialPlayers = value));
        const initialCount = initialPlayers.length;

        service.addPlayer(undefined as unknown as Player);

        let finalPlayers: Player[] = [];
        service.players$.subscribe((value) => (finalPlayers = value));

        expect(finalPlayers.length).toBe(initialCount);
    });

    it('should not add player when player does not exist in current players', () => {
        service.setPlayers([]);

        service.addPlayer(mockPlayers[0]);

        let players: Player[] = [];
        service.players$.subscribe((value) => (players = value));

        expect(players.length).toBe(0);
    });

    it('should not add player when max players reached', () => {
        const maxPlayers: Player[] = [];
        for (let i = 0; i < MAX_PLAYERS; i++) {
            maxPlayers.push({
                ...mockPlayers[0],
                id: `${i}`,
                name: `player${i}`,
            });
        }

        service.setPlayers(maxPlayers);

        const newPlayer: Player = {
            ...mockPlayers[0],
            id: 'new',
            name: 'newPlayer',
        };

        service.addPlayer(newPlayer);

        let players: Player[] = [];
        service.players$.subscribe((value) => (players = value));

        expect(players.length).toBe(MAX_PLAYERS);
    });

    it('should remove player when conditions are met', () => {
        const testPlayers = [
            {
                id: '1',
                name: 'player1',
                avatar: '1',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 5,
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
            {
                id: '2',
                name: 'player2',
                avatar: '2',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 10,
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
        ];

        service.setPlayers(testPlayers);

        let initialPlayers: Player[] = [];
        service.players$.subscribe((players) => (initialPlayers = players));
        const initialCount = initialPlayers.length;

        const playerToRemove = initialPlayers.find((p) => p.name === 'player2');
        expect(playerToRemove).toBeTruthy();

        if (playerToRemove) {
            service.removePlayer(playerToRemove);

            let updatedPlayers: Player[] = [];
            service.players$.subscribe((players) => (updatedPlayers = players));

            expect(updatedPlayers.length).toBe(initialCount - 1);
            expect(updatedPlayers.find((p) => p.name === 'player2')).toBeUndefined();
        }
    });

    it('should not remove player when player is undefined', () => {
        service.setPlayers(mockPlayers);

        let playersBefore: Player[] = [];
        service.players$.subscribe((value) => (playersBefore = value));
        const initialCount = playersBefore.length;

        try {
            service.removePlayer(undefined as unknown as Player);

            expect(true).toBe(true);
        } catch (error) {
            fail('removePlayer should handle undefined player without error');
        }

        let playersAfter: Player[] = [];
        service.players$.subscribe((value) => (playersAfter = value));

        expect(playersAfter.length).toBe(initialCount);
    });

    it('should not remove player when player does not exist', () => {
        const testPlayers = getNewPlayers().slice(0, 2);
        service.setPlayers(testPlayers);

        const nonExistentPlayer: Player = {
            id: '999',
            name: 'nonExistent',
            avatar: '1',
            life: 100,
            attack: 10,
            defense: 10,
            rapidity: 5,
            attackDice: 'd6',
            defenseDice: 'd4',
            movementPts: 5,
            actions: 2,
        };

        service.removePlayer(nonExistentPlayer);

        let players: Player[] = [];
        service.players$.subscribe((value) => (players = value));
        expect(players.length).toBe(2);
    });

    it('should not remove player when players array is empty', () => {
        service.setPlayers([]);

        service.removePlayer(mockPlayers[0]);

        let players: Player[] = [];
        service.players$.subscribe((value) => (players = value));

        expect(players.length).toBe(0);
    });

    it('should remove all players', () => {
        service.setPlayers(mockPlayers);

        service.removeAllPlayers();

        let players: Player[] = [];
        service.players$.subscribe((value) => (players = value));

        expect(players.length).toBe(0);
    });
});
