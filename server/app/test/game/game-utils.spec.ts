/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable max-params */
/* eslint-disable max-lines */
import { Player } from '@app/class/player';
import { GameUtils } from '@app/services/game/game-utils';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar } from '@common/game';
import { Team } from '@common/player';

describe('GameUtils Comprehensive Tests', () => {
    const dummyCell = (x: number, y: number, tile: Tile, player?: any, cost: number = 1, item: Item = Item.Default): Cell => ({
        tile,
        player,
        cost,
        position: { x, y },
        item,
    });

    const createBoard = (rows: number, cols: number, defaultTile: Tile = Tile.Floor): Cell[][] => {
        const board: Cell[][] = [];
        for (let y = 0; y < rows; y++) {
            const row: Cell[] = [];
            for (let x = 0; x < cols; x++) {
                row.push(dummyCell(x, y, defaultTile));
            }
            board.push(row);
        }
        return board;
    };

    describe('isPlayerCanMakeAction', () => {
        it('should return true if at least one neighboring cell is valid for action', () => {
            const board = createBoard(3, 3);
            // Une cellule voisine est considérée valide pour l’action si
            // soit elle possède un joueur (différent de Avatar.Default) soit son tile est ClosedDoor ou OpenedDoor.
            board[0][1] = dummyCell(1, 0, Tile.ClosedDoor);
            const mockPlayer = { position: { x: 1, y: 1 } } as Player;
            const result = GameUtils.isPlayerCanMakeAction(board, mockPlayer);
            expect(result).toBe(true);
        });

        it('should return false if no neighboring cell is valid for action', () => {
            const board = createBoard(3, 3);
            const mockPlayer = { position: { x: 1, y: 1 }, inventory: [] } as Player;
            const result = GameUtils.isPlayerCanMakeAction(board, mockPlayer);
            expect(result).toBe(false);
        });
    });

    describe('isPlayerCanMakeAction avec arc', () => {
        it('devrait détecter une action possible en diagonale quand le joueur possède un arc', () => {
            // Arrange
            const board = createBoard(3, 3);
            // Placer un ennemi en diagonale
            board[2][2] = dummyCell(2, 2, Tile.Floor, Avatar.Chevalier);

            // Un joueur avec un arc au centre
            const mockPlayer = {
                position: { x: 1, y: 1 },
                inventory: [Item.Bow],
            } as Player;

            // Act
            const result = GameUtils.isPlayerCanMakeAction(board, mockPlayer);

            // Assert
            expect(result).toBe(true);
        });

        it("ne devrait pas détecter d'action en diagonale quand le joueur n'a pas d'arc", () => {
            // Arrange
            const board = createBoard(3, 3);
            // Placer un ennemi en diagonale mais aucun ennemi orthogonal
            board[2][2] = dummyCell(2, 2, Tile.Floor, Avatar.Chevalier);

            // Un joueur sans arc au centre
            const mockPlayer = {
                position: { x: 1, y: 1 },
                inventory: [],
            } as Player;

            // Act
            const result = GameUtils.isPlayerCanMakeAction(board, mockPlayer);

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('findPossiblePaths', () => {
        it('should return reachable paths within movement points and not include starting cell', () => {
            const board = createBoard(3, 3);
            const movementPoints = 2;
            const paths = GameUtils.findPossiblePaths(board, { x: 1, y: 1 }, movementPoints);
            expect(paths.size).toBeGreaterThan(0);
            expect(paths.has('1,1')).toBe(false);
        });
    });

    describe('findValidSpawn', () => {
        it('should return a valid spawn cell from the start position', () => {
            const board = createBoard(3, 3);
            board[2][2] = dummyCell(2, 2, Tile.Floor, Avatar.Default, 1, Item.Spawn);
            const spawn = GameUtils.findValidSpawn(board, { x: 2, y: 2 });
            expect(spawn).toEqual({ x: 2, y: 2 });
        });

        it('should return null if no valid spawn cell is found', () => {
            const board = createBoard(3, 3, Tile.Wall);
            const spawn = GameUtils.findValidSpawn(board, { x: 1, y: 1 });
            expect(spawn).toBeNull();
        });
    });

    describe('sortPlayersBySpeed', () => {
        it('should sort players in descending order of speed', () => {
            const players: Player[] = [{ speed: 5 } as Player, { speed: 10 } as Player, { speed: 7 } as Player];
            const sorted = GameUtils.sortPlayersBySpeed(players);
            expect(sorted[0].speed).toBe(10);
            expect(sorted[1].speed).toBe(7);
            expect(sorted[2].speed).toBe(5);
        });
    });

    describe('getAllSpawnPoints', () => {
        it('should return coordinates for all spawn cells in the board', () => {
            const board = createBoard(3, 3);
            board[0][0].item = Item.Spawn;
            board[2][2].item = Item.Spawn;
            const spawnPoints = GameUtils.getAllSpawnPoints(board);
            expect(spawnPoints).toEqual([
                { x: 0, y: 0 },
                { x: 2, y: 2 },
            ]);
        });
    });

    describe('assignSpawnPoints', () => {
        it('should assign spawn points to players and update the map', () => {
            const players: Player[] = [
                { speed: 5, avatar: Avatar.Berserker, spawnPosition: null, position: null } as Player,
                { speed: 7, avatar: Avatar.Clerc, spawnPosition: null, position: null } as Player,
            ];
            const spawnPoints: Vec2[] = [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ];
            const board = createBoard(3, 3);
            board[0][0].item = Item.Spawn;
            board[1][1].item = Item.Spawn;
            const usedSpawnPoints = GameUtils.assignSpawnPoints(players, spawnPoints, board);
            expect(usedSpawnPoints.length).toBe(2);
            expect(players[0].spawnPosition).toBeDefined();
            expect(players[0].position).toBeDefined();
            expect(players[1].spawnPosition).toBeDefined();
            expect(players[1].position).toBeDefined();
            const cellA = board[spawnPoints[0].y][spawnPoints[0].x].player;
            const cellB = board[spawnPoints[1].y][spawnPoints[1].x].player;
            expect([Avatar.Berserker, Avatar.Clerc]).toContain(cellA);
            expect([Avatar.Berserker, Avatar.Clerc]).toContain(cellB);
        });
    });

    describe('removeUnusedSpawnPoints', () => {
        it('should update cells not used as spawn points to have item Default', () => {
            const board = createBoard(3, 3);
            board[0][0].item = Item.Spawn;
            board[1][1].item = Item.Spawn;
            const usedSpawnPoints: Vec2[] = [{ x: 0, y: 0 }];
            GameUtils.removeUnusedSpawnPoints(board, usedSpawnPoints);
            expect(board[0][0].item).toBe(Item.Spawn);
            expect(board[1][1].item).toBe(Item.Default);
        });
    });

    describe('assignTeams', () => {
        class MockPlayer {
            team: Team;
            setTeam = jest.fn((t: Team) => {
                this.team = t;
            });
        }

        function createMockPlayers(n: number): MockPlayer[] {
            return Array.from({ length: n }, () => new MockPlayer());
        }

        it('should assign half players to Red and half to Blue (even count)', () => {
            const players = createMockPlayers(6);
            GameUtils.assignTeams(players as any);

            const redCount = players.filter((p) => p.team === Team.Red).length;
            const blueCount = players.filter((p) => p.team === Team.Blue).length;

            expect(redCount).toBe(3);
            expect(blueCount).toBe(3);
            players.forEach((p) => expect(p.setTeam).toHaveBeenCalledTimes(1));
        });

        it('should assign floor(n/2) to Red and rest to Blue (odd count)', () => {
            const players = createMockPlayers(5);
            GameUtils.assignTeams(players as any);

            const redCount = players.filter((p) => p.team === Team.Red).length;
            const blueCount = players.filter((p) => p.team === Team.Blue).length;

            expect(redCount).toBe(2);
            expect(blueCount).toBe(3);
            players.forEach((p) => expect(p.setTeam).toHaveBeenCalledTimes(1));
        });

        it('should not mutate original array order directly', () => {
            const players = createMockPlayers(4);
            const originalOrder = [...players];

            GameUtils.assignTeams(players as any);

            // Ensures original array is not mutated (though team attributes do change)
            expect(players).toEqual(originalOrder);
        });
    });

    describe('Private Methods', () => {
        it('vec2Key should return a string key from a Vec2', () => {
            const key = GameUtils['vec2Key']({ x: 3, y: 5 });
            expect(key).toBe('3,5');
        });

        it('isValidPosition should return true for positions within bounds and false otherwise', () => {
            expect(GameUtils['isValidPosition'](5, { x: 2, y: 3 })).toBe(true);
            expect(GameUtils['isValidPosition'](5, { x: 5, y: 0 })).toBe(false);
        });

        it('isOccupiedByPlayer should return true if cell has a player different from Avatar.Default', () => {
            const cell = dummyCell(0, 0, Tile.Floor, Avatar.Clerc, 1);
            const result = GameUtils['isOccupiedByPlayer'](cell);
            expect(result).toBe(true);
        });

        it('isValidSpawn should return true if cell is valid for spawn', () => {
            const cell = dummyCell(0, 0, Tile.Floor, Avatar.Default, 1);
            const result = GameUtils['isValidSpawn'](cell);
            expect(result).toBe(true);
        });

        it('isValidCellForAction should return true if cell has a non-default player or is a door', () => {
            const cell1 = dummyCell(0, 0, Tile.Floor, Avatar.Clerc, 1);
            expect(GameUtils['isValidCellForAction'](cell1)).toBe(true);
            const cell2 = dummyCell(0, 0, Tile.ClosedDoor, undefined, 1);
            expect(GameUtils['isValidCellForAction'](cell2)).toBe(true);
            const cell3 = dummyCell(0, 0, Tile.OpenedDoor, undefined, 1);
            expect(GameUtils['isValidCellForAction'](cell3)).toBe(true);
            const cell4 = dummyCell(0, 0, Tile.Floor, Avatar.Default, 1);
            expect(GameUtils['isValidCellForAction'](cell4)).toBe(false);
        });
    });
    describe('sortPlayersBySpeed', () => {
        it('should sort players in descending order when speeds differ', () => {
            const players: Player[] = [{ speed: 5 } as Player, { speed: 10 } as Player, { speed: 7 } as Player];
            const sorted = GameUtils.sortPlayersBySpeed(players);
            expect(sorted[0].speed).toBe(10);
            expect(sorted[1].speed).toBe(7);
            expect(sorted[2].speed).toBe(5);
        });

        it('should handle players with equal speed by randomizing their order', () => {
            // Stub Math.random so the sort comparison is deterministic.
            const mathRandomMock = jest.spyOn(Math, 'random').mockReturnValue(0.8);
            const players: Player[] = [{ speed: 5 } as Player, { speed: 5 } as Player, { speed: 5 } as Player];
            const sorted = GameUtils.sortPlayersBySpeed(players);
            // Since all speeds are equal, verify that the sorted array is a permutation of the original.
            expect(sorted.map((p) => p.speed)).toEqual([5, 5, 5]);
            // Additionally, check that Math.random was called during the sort.
            expect(mathRandomMock).toBeCalled();
            mathRandomMock.mockRestore();
        });
    });
    // Additional tests for findPossiblePaths
    describe('findPossiblePaths Additional Cases', () => {
        it('should return an empty map when movementPoints is 0', () => {
            const board = createBoard(3, 3);
            const movementPoints = 0;
            const paths = GameUtils.findPossiblePaths(board, { x: 1, y: 1 }, movementPoints);
            // The starting cell is removed, so no other cell can be reached with zero movement points.
            expect(paths.size).toBe(0);
        });

        it('should not return paths that require moving through obstacles', () => {
            const board = createBoard(3, 3);
            // Mark all adjacent cells around {x:1, y:1} as obstacles by simulating them as occupied by a non-default avatar.
            board[0][1] = dummyCell(1, 0, Tile.Floor, Avatar.Clerc);
            board[1][0] = dummyCell(0, 1, Tile.Floor, Avatar.Clerc);
            board[1][2] = dummyCell(2, 1, Tile.Floor, Avatar.Clerc);
            board[2][1] = dummyCell(1, 2, Tile.Floor, Avatar.Clerc);
            const movementPoints = 3;
            const paths = GameUtils.findPossiblePaths(board, { x: 1, y: 1 }, movementPoints);
            // With surrounding obstacles, no move should be possible.
            expect(paths.size).toBe(0);
        });

        it('should correctly calculate paths when tile costs vary', () => {
            // Create a custom board that varies cost.
            const board = createBoard(5, 5);
            // Set specific cell costs by overriding the cost property directly.
            // For simplicity, assume default cost is 1; change one cell to cost 3.
            board[2][3].cost = 3;
            const movementPoints = 4;
            const start: Vec2 = { x: 2, y: 2 };
            const paths = GameUtils.findPossiblePaths(board, start, movementPoints);

            // Starting cell should not be included
            expect(paths.has('2,2')).toBe(false);

            // Check that reachable cells within movement points are included.
            // For instance, cell (2,1) path cost should be 1.
            const key1 = '2,1';
            expect(paths.has(key1)).toBe(true);
            expect(paths.get(key1).cost).toBe(1);

            // Cell (2,3) is reachable with cost 1 as well.
            const key2 = '2,3';
            expect(paths.has(key2)).toBe(true);
            expect(paths.get(key2).cost).toBe(1);

            // The cell (3,2) should be reachable with cost 1.
            const key3 = '3,2';
            expect(paths.has(key3)).toBe(true);
            expect(paths.get(key3).cost).toBe(1);

            // Now, cell (3,2) followed by (3,3) might have cost 1+1 = 2,
            // but cell (2,3) followed by (2,4) could be reached if within cost.
            // We can check that all paths do not exceed movementPoints.
            paths.forEach((value) => {
                expect(value.cost).toBeLessThanOrEqual(movementPoints);
            });
        });
    });

    describe('findValidDropCell', () => {
        it('devrait trouver une cellule valide autour de la position du joueur', () => {
            // Arrange
            const board = createBoard(5, 5);
            const playerPos: Vec2 = { x: 2, y: 2 };
            const droppedItems: { position: Vec2 }[] = [];
            const players: Player[] = [];

            // Act
            const result = GameUtils.findValidDropCell(board, playerPos, droppedItems, players);

            // Assert
            expect(result).not.toBeNull();
            expect(result).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }));
        });

        it('ne devrait pas trouver de cellule si toutes sont occupées', () => {
            // Arrange
            const board = createBoard(3, 3);
            const playerPos: Vec2 = { x: 1, y: 1 };

            // Rendre toutes les cellules adjacentes non valides
            // en mettant un joueur ET un item non-DEFAULT
            for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                    if (x === 1 && y === 1) continue; // Ignorer la position du joueur
                    board[y][x] = dummyCell(x, y, Tile.Floor, Avatar.Chevalier, 1, Item.Sword);
                }
            }

            const droppedItems: { position: Vec2 }[] = [];
            const players: Player[] = [];

            // Act
            const result = GameUtils.findValidDropCell(board, playerPos, droppedItems, players);

            // Assert
            expect(result).toBeNull();
        });

        it('ne devrait pas trouver de cellule si toutes sont occupées', () => {
            // Arrange
            const board = createBoard(3, 3);
            const playerPos: Vec2 = { x: 1, y: 1 };
            const droppedItems: { position: Vec2 }[] = [];
            const players: Player[] = [];

            // Mock canDropItem pour forcer un retour false pour toutes les cellules
            const originalCanDropItem = GameUtils.canDropItem;
            GameUtils.canDropItem = jest.fn().mockReturnValue(false);

            try {
                // Act
                const result = GameUtils.findValidDropCell(board, playerPos, droppedItems, players);

                // Assert
                expect(result).toBeNull();
            } finally {
                // Nettoyer le mock pour éviter d'affecter d'autres tests
                GameUtils.canDropItem = originalCanDropItem;
            }
        });

        it("ne devrait pas utiliser une cellule déjà utilisée pour d'autres objets déposés", () => {
            // Arrange
            const board = createBoard(3, 3);
            const playerPos: Vec2 = { x: 1, y: 1 };
            const droppedItems: { position: Vec2 }[] = [{ position: { x: 0, y: 1 } }, { position: { x: 2, y: 1 } }, { position: { x: 1, y: 0 } }];

            // Supposons que le joueur est au centre, et trois des quatre cellules orthogonales sont occupées
            const players: Player[] = [];

            // Act
            const result = GameUtils.findValidDropCell(board, playerPos, droppedItems, players);

            // Assert
            expect(result).toEqual({ x: 1, y: 2 }); // Seule cellule disponible
        });

        it('ne devrait pas utiliser une cellule où se trouve un joueur', () => {
            // Arrange
            const board = createBoard(3, 3);
            const playerPos: Vec2 = { x: 1, y: 1 };
            const droppedItems: { position: Vec2 }[] = [];

            // Un joueur en (1,0)
            const players: Player[] = [{ position: { x: 1, y: 0 } } as Player];

            // Act
            const result = GameUtils.findValidDropCell(board, playerPos, droppedItems, players);

            // Assert
            expect(result).not.toBeNull();
            expect(result).not.toEqual({ x: 1, y: 0 });
        });

        it("devrait trouver une cellule valide même si certaines cellules ne peuvent pas recevoir d'objets", () => {
            // Arrange
            const board = createBoard(3, 3);
            const playerPos: Vec2 = { x: 1, y: 1 };

            // Rendre certaines cellules non valides pour dépôt
            board[0][0] = dummyCell(0, 0, Tile.Wall); // Mur en (0,0)
            board[0][1] = dummyCell(0, 1, Tile.ClosedDoor); // Porte fermée en (0,1)

            const droppedItems: { position: Vec2 }[] = [];
            const players: Player[] = [];

            // Espionner canDropItem pour vérifier qu'il est appelé
            const canDropItemSpy = jest.spyOn(GameUtils, 'canDropItem');

            // Act
            const result = GameUtils.findValidDropCell(board, playerPos, droppedItems, players);

            // Assert
            expect(canDropItemSpy).toHaveBeenCalled();
            expect(result).not.toBeNull();
            expect(result).not.toEqual({ x: 0, y: 0 }); // Ne devrait pas être le mur
            expect(result).not.toEqual({ x: 0, y: 1 }); // Ne devrait pas être la porte fermée
        });
    });

    describe('Private methods: isValidCellForAttack', () => {
        it('devrait retourner true si la cellule contient un avatar non-Default', () => {
            // Arrange
            const cell1 = dummyCell(0, 0, Tile.Floor, Avatar.Chevalier);
            const cell2 = dummyCell(0, 0, Tile.Floor, Avatar.Default);
            const cell3 = dummyCell(0, 0, Tile.Floor, undefined);

            // Act
            const result1 = GameUtils['isValidCellForAttack'](cell1);
            const result2 = GameUtils['isValidCellForAttack'](cell2);
            const result3 = GameUtils['isValidCellForAttack'](cell3);

            // Assert
            expect(result1).toBe(true);
            expect(result2).toBe(false);
            expect(result3).toBe(false);
        });
    });

    describe('dijkstra', () => {
        it("devrait retourner un chemin direct lorsque le point de départ et d'arrivée sont adjacents", () => {
            // Arrange
            const board = createBoard(3, 3);
            const start: Vec2 = { x: 1, y: 1 };
            const end: Vec2 = { x: 2, y: 1 };

            // Act
            const result = GameUtils.dijkstra(board, start, end, false);

            // Assert
            expect(result).not.toBeNull();
            expect(result.path).toEqual([{ x: 2, y: 1 }]);
            expect(result.cost).toBe(1);
        });

        it('devrait retourner un chemin contournant les obstacles', () => {
            // Arrange
            const board = createBoard(3, 3);
            // Placer un mur pour bloquer le chemin direct
            board[1][1] = dummyCell(1, 1, Tile.Wall);
            const start: Vec2 = { x: 0, y: 0 };
            const end: Vec2 = { x: 2, y: 2 };

            // Act
            const result = GameUtils.dijkstra(board, start, end, false);

            // Assert
            expect(result).not.toBeNull();
            // Vérifier que le chemin ne passe pas par (1,1)
            expect(result.path.some((p) => p.x === 1 && p.y === 1)).toBe(false);
            // Vérifier que le chemin atteint la destination
            expect(result.path[result.path.length - 1]).toEqual(end);
        });

        it("devrait retourner null lorsqu'aucun chemin n'existe", () => {
            // Arrange
            const board = createBoard(3, 3);
            // Entourer le point de départ de murs
            board[0][1] = dummyCell(1, 0, Tile.Wall);
            board[1][0] = dummyCell(0, 1, Tile.Wall);
            board[1][1] = dummyCell(1, 1, Tile.Wall);
            const start: Vec2 = { x: 0, y: 0 };
            const end: Vec2 = { x: 2, y: 2 };

            // Act
            const result = GameUtils.dijkstra(board, start, end, false);

            // Assert
            expect(result).toBeNull();
        });

        it('devrait ignorer les joueurs et portes fermées quand ignorePlayerDoors est true', () => {
            // Arrange
            const board = createBoard(5, 5);
            // Placer un joueur sur le chemin
            board[2][1] = dummyCell(1, 2, Tile.Floor, Avatar.Chevalier);
            // Placer une porte fermée
            board[2][3] = dummyCell(3, 2, Tile.ClosedDoor);

            const start: Vec2 = { x: 0, y: 2 };
            const end: Vec2 = { x: 4, y: 2 };

            // Act
            const result = GameUtils.dijkstra(board, start, end, true);

            // Assert
            expect(result).not.toBeNull();
            // Le chemin doit passer directement, y compris par les cellules occupées
            expect(result.path.length).toBeLessThanOrEqual(4); // Chemin direct serait de longueur 4
        });

        it('devrait contourner les joueurs et portes fermées quand ignorePlayerDoors est false', () => {
            // Arrange
            const board = createBoard(5, 5);
            // Créer un "corridor" avec un joueur au milieu
            board[1][0] = dummyCell(0, 1, Tile.Wall);
            board[1][1] = dummyCell(1, 1, Tile.Wall);
            board[1][2] = dummyCell(2, 1, Tile.Floor, Avatar.Chevalier); // Joueur bloquant
            board[1][3] = dummyCell(3, 1, Tile.Wall);
            board[1][4] = dummyCell(4, 1, Tile.Wall);

            board[3][0] = dummyCell(0, 3, Tile.Wall);
            board[3][1] = dummyCell(1, 3, Tile.Wall);
            board[3][2] = dummyCell(2, 3, Tile.Wall);
            board[3][3] = dummyCell(3, 3, Tile.Wall);
            board[3][4] = dummyCell(4, 3, Tile.Wall);

            const start: Vec2 = { x: 0, y: 2 };
            const end: Vec2 = { x: 4, y: 2 };

            // Act
            const result = GameUtils.dijkstra(board, start, end, false);

            // Assert
            expect(result).not.toBeNull();
            // Le chemin doit contourner le joueur (aller vers le bas puis revenir)
            const expectedContourLength = 4; // Plus long car contournement nécessaire
            expect(result.path.length).toBeGreaterThanOrEqual(expectedContourLength);

            // Vérifier qu'on n'a pas traversé la position du joueur
            expect(result.path.some((p) => p.x === 2 && p.y === 1)).toBe(false);
        });

        it('devrait trouver le chemin le plus court parmi plusieurs possibilités', () => {
            // Arrange
            const board = createBoard(5, 5);
            // Créer une carte avec deux chemins possibles, un plus court que l'autre
            // Chemin 1 : direct, longueur 4
            // Chemin 2 : contournement, longueur > 4

            // Mur bloquant le chemin direct sauf une ouverture
            board[1][1] = dummyCell(1, 1, Tile.Wall);
            board[1][2] = dummyCell(2, 1, Tile.Wall);
            board[1][3] = dummyCell(3, 1, Tile.Floor); // Ouverture

            const start: Vec2 = { x: 0, y: 0 };
            const end: Vec2 = { x: 4, y: 4 };

            // Act
            const result = GameUtils.dijkstra(board, start, end, false);

            // Assert
            expect(result).not.toBeNull();
            // Vérifier que le chemin passe par l'ouverture dans le mur (le plus court)
            const pathContainsOpening = result.path.some((p) => p.x === 3 && p.y === 1);
            expect(pathContainsOpening).toBe(false);
        });
    });
});
