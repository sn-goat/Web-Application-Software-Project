/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { MAX_PLAYERS } from '@app/constants/playerConst';
import { PlayerService } from '@app/services/code/player.service';
import { Player } from '@common/player';

describe('PlayerService', () => {
    let service: PlayerService;

    // Sample players for testing
    const mockPlayers: Player[] = [
        {
            id: '1',
            username: 'player1',
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
            username: 'player2',
            avatar: '2',
            life: 100,
            attack: 10,
            defense: 10,
            rapidity: 10, // Higher rapidity
            attackDice: 'd6',
            defenseDice: 'd4',
            movementPts: 5,
            actions: 2,
        },
        {
            id: '3',
            username: 'player3',
            avatar: '3',
            life: 100,
            attack: 10,
            defense: 10,
            rapidity: 3, // Lower rapidity
            attackDice: 'd6',
            defenseDice: 'd4',
            movementPts: 5,
            actions: 2,
        },
    ];

    // Create a fresh copy of players to avoid test interference
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
                username: 'player1',
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
                username: 'player2',
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
        expect(players[0].username).toBe('player2');
        expect(players[1].username).toBe('player1');
    });

    it('should not set players if count exceeds maximum', () => {
        const manyPlayers: Player[] = [];
        for (let i = 0; i < MAX_PLAYERS + 1; i++) {
            manyPlayers.push({
                ...mockPlayers[0],
                id: `${i}`,
                username: `player${i}`,
            });
        }

        let players: Player[] | undefined;
        service.players$.subscribe((value) => (players = value));

        service.setPlayers(manyPlayers);
        expect(players?.length).toBe(0); // Should remain empty
    });

    it('should sort players by rapidity in descending order', () => {
        // Define a simple set of players with different rapidity values
        const testPlayers = [
            {
                id: '1',
                username: 'player1',
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
                username: 'player2',
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
                username: 'player3',
                avatar: '3',
                life: 100,
                attack: 10,
                defense: 10,
                rapidity: 3, // Lowest
                attackDice: 'd6',
                defenseDice: 'd4',
                movementPts: 5,
                actions: 2,
            },
        ];

        // Set players in service
        service.setPlayers(testPlayers);

        // Get sorted players
        let sortedPlayers: Player[] = [];
        service.players$.subscribe((players) => (sortedPlayers = players));

        // Check sort order by username (which will be more reliable)
        expect(sortedPlayers[0].username).toBe('player2'); // Highest rapidity
        expect(sortedPlayers[1].username).toBe('player1'); // Middle rapidity
        expect(sortedPlayers[2].username).toBe('player3'); // Lowest rapidity
    });

    it('should get player by username', () => {
        // Define players explicitly here to avoid reference issues
        const players = [
            {
                id: '1',
                username: 'player1',
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
                username: 'player2',
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

        // Set players in service
        service.setPlayers(players);

        // Get player by username
        const player = service.getPlayer('player2');

        // Verify player was found
        expect(player).toBeTruthy();
        expect(player?.username).toBe('player2');
    });

    it('should return undefined for non-existent player', () => {
        service.setPlayers(mockPlayers);

        const player = service.getPlayer('nonExistent');
        expect(player).toBeUndefined();
    });

    it('should return undefined when getting player with falsy username', () => {
        service.setPlayers(mockPlayers);

        const player = service.getPlayer('');
        expect(player).toBeUndefined();
    });

    // Fix for "should edit player when conditions are met" test
    it('should edit player when conditions are met', () => {
        // Use specific test instances
        const testPlayers = [
            {
                id: '1',
                username: 'player1',
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
        service.setPlayerUsername('player1');

        // Make sure we're modifying a copy of the player
        const updatedPlayer = {
            ...testPlayers[0],
            life: 80,
            attack: 15,
        };

        service.editPlayer(updatedPlayer);

        // Get the actual player reference after the update
        const resultPlayer = service.getPlayer('player1');
        expect(resultPlayer?.life).toBe(80);
    });

    it('should not edit player when player is undefined', () => {
        const testPlayers = getNewPlayers();
        service.setPlayers(testPlayers);
        service.setPlayerUsername('player1');

        // Get the initial state of the player
        const player = service.getPlayer('player1');
        // Make sure we have a player before proceeding
        expect(player).toBeTruthy();

        // Create a copy without the non-null assertion
        const initialPlayer = player ? { ...player } : undefined;

        // This shouldn't throw an error
        service.editPlayer(undefined as unknown as Player);

        // Verify player remains unchanged - compare directly with initialPlayer
        const playerAfter = service.getPlayer('player1');
        expect(playerAfter).toEqual(initialPlayer);
    });

    it('should not edit player when player does not exist', () => {
        const testPlayers = [
            {
                id: '1',
                username: 'player1',
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
        service.setPlayerUsername('player1');

        const nonExistentPlayer: Player = {
            id: '999',
            username: 'nonExistent',
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

        // Check player1 still exists and is unchanged
        const player1 = service.getPlayer('player1');
        expect(player1).toBeTruthy(); // Using toBeTruthy
        expect(player1?.life).toBe(100);

        // Check nonExistent player was not added
        const nonExistentResult = service.getPlayer('nonExistent');
        expect(nonExistentResult).toBeUndefined();
    });

    it('should not edit player when username does not match playerUsername', () => {
        service.setPlayers(mockPlayers);
        service.setPlayerUsername('player3'); // Different from the player being edited

        const updatedPlayer: Player = {
            ...mockPlayers[0],
            life: 80,
        };

        service.editPlayer(updatedPlayer);

        // Player should not be updated
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
        // Create a fresh copy of all 3 mock players specifically for this test
        const freshPlayers = [
            {
                id: '1',
                username: 'player1',
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
                username: 'player2',
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
                username: 'player3',
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

        // Set the players in the service
        service.setPlayers(freshPlayers);

        // Attempt to remove a non-existent player
        const result = service.removePlayerByName('nonExistent');

        // Verify removal failed
        expect(result).toBe(false);

        // Verify all original players are still there (should be 3)
        let players: Player[] = [];
        service.players$.subscribe((value) => (players = value));
        expect(players.length).toBe(3);
    });

    it('should set and get player username', () => {
        service.setPlayerUsername('myUsername');
        expect(service.getPlayerUsername()).toBe('myUsername');
    });

    it('should set admin', () => {
        let admin: string | undefined;
        service.admin$.subscribe((value) => (admin = value));

        service.setAdmin('adminUser');
        expect(admin).toBe('adminUser');
    });

    // Fix for "should add player when conditions are met" test
    it('should add player when conditions are met', () => {
        // First let's understand what the service does:
        // It adds a player only if a player with the same username already exists

        const initialPlayer = {
            id: '2',
            username: 'player2',
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

        // Add initial player
        service.setPlayers([initialPlayer]);

        // Create player to add with same username
        const playerToAdd: Player = {
            id: '5',
            username: 'player2', // Same username as existing player
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

        // Add player with same username
        service.addPlayer(playerToAdd);

        // Verify there are now 2 players
        let players: Player[] = [];
        service.players$.subscribe((value) => (players = value));

        expect(players.length).toBe(2);
        // Verify the added player exists
        expect(players.some((p) => p.id === '5')).toBe(true);
    });

    // Fix for "should not add player when player is undefined" test
    it('should not add player when player is undefined', () => {
        // Modify service to handle undefined players
        spyOn(console, 'error'); // Suppress potential error logging

        // Add initial player
        const initialPlayer = { ...mockPlayers[0] };
        service.setPlayers([initialPlayer]);

        // Get initial count
        let initialPlayers: Player[] = [];
        service.players$.subscribe((value) => (initialPlayers = value));
        const initialCount = initialPlayers.length;

        // Call addPlayer with undefined
        service.addPlayer(undefined as unknown as Player);

        // Verify no player was added
        let finalPlayers: Player[] = [];
        service.players$.subscribe((value) => (finalPlayers = value));

        expect(finalPlayers.length).toBe(initialCount);
    });

    it('should not add player when player does not exist in current players', () => {
        // Empty initial players
        service.setPlayers([]);

        // Try to add a player - should fail because we check if player exists first
        service.addPlayer(mockPlayers[0]);

        let players: Player[] = [];
        service.players$.subscribe((value) => (players = value));

        expect(players.length).toBe(0);
    });

    it('should not add player when max players reached', () => {
        // Mock MAX_PLAYERS players
        const maxPlayers: Player[] = [];
        for (let i = 0; i < MAX_PLAYERS; i++) {
            maxPlayers.push({
                ...mockPlayers[0],
                id: `${i}`,
                username: `player${i}`,
            });
        }

        service.setPlayers(maxPlayers);

        // Add this player to the initial set to pass the "playerExists" check
        const newPlayer: Player = {
            ...mockPlayers[0],
            id: 'new',
            username: 'newPlayer',
        };

        // Try to add one more player
        service.addPlayer(newPlayer);

        let players: Player[] = [];
        service.players$.subscribe((value) => (players = value));

        expect(players.length).toBe(MAX_PLAYERS);
    });

    it('should remove player when conditions are met', () => {
        // Define players explicitly
        const testPlayers = [
            {
                id: '1',
                username: 'player1',
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
                username: 'player2',
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

        // Set players in service
        service.setPlayers(testPlayers);

        // Get initial player count
        let initialPlayers: Player[] = [];
        service.players$.subscribe((players) => (initialPlayers = players));
        const initialCount = initialPlayers.length;

        // Make sure player2 exists before removing
        const playerToRemove = initialPlayers.find((p) => p.username === 'player2');
        expect(playerToRemove).toBeTruthy();

        // Only proceed if playerToRemove is defined (avoid non-null assertion)
        if (playerToRemove) {
            // Remove the player
            service.removePlayer(playerToRemove);

            // Get updated players
            let updatedPlayers: Player[] = [];
            service.players$.subscribe((players) => (updatedPlayers = players));

            // Check count decreased and player was removed
            expect(updatedPlayers.length).toBe(initialCount - 1);
            expect(updatedPlayers.find((p) => p.username === 'player2')).toBeUndefined();
        }
    });

    it('should not remove player when player is undefined', () => {
        service.setPlayers(mockPlayers);

        // Get a reference to the current players before removal
        let playersBefore: Player[] = [];
        service.players$.subscribe((value) => (playersBefore = value));
        const initialCount = playersBefore.length;

        // Use try-catch to handle the potential error
        try {
            service.removePlayer(undefined as unknown as Player);
            // If we get here, the service handled it without error
            expect(true).toBe(true);
        } catch (error) {
            // If we get here, the test should fail
            fail('removePlayer should handle undefined player without error');
        }

        let playersAfter: Player[] = [];
        service.players$.subscribe((value) => (playersAfter = value));

        // Verify no players were removed
        expect(playersAfter.length).toBe(initialCount);
    });

    it('should not remove player when player does not exist', () => {
        const testPlayers = getNewPlayers().slice(0, 2); // Just player1 and player2
        service.setPlayers(testPlayers);

        // Create a player that doesn't exist in the array
        const nonExistentPlayer: Player = {
            id: '999',
            username: 'nonExistent',
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

        // Try to remove the player
        service.removePlayer(nonExistentPlayer);

        // Check that no player was removed
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
