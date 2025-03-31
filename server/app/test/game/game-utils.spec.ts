/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable max-params */
import { Player } from '@app/class/player';
import { GameUtils } from '@app/services/game/game-utils';
import { Cell, TILE_COST, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar } from '@common/game';

describe('GameUtils Comprehensive Tests', () => {
    // Utilitaire pour créer une cellule factice
    const dummyCell = (x: number, y: number, tile: Tile, player?: any, cost: number = 1, item: Item = Item.DEFAULT): Cell => ({
        tile,
        player,
        cost,
        position: { x, y },
        item,
    });

    // Utilitaire pour créer un plateau (board)
    const createBoard = (rows: number, cols: number, defaultTile: Tile = Tile.FLOOR): Cell[][] => {
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

    // Tests pour isPlayerCanMakeAction
    describe('isPlayerCanMakeAction', () => {
        it('should return true if at least one neighboring cell is valid for action', () => {
            const board = createBoard(3, 3);
            // Une cellule voisine est considérée valide pour l’action si
            // soit elle possède un joueur (différent de Avatar.Default) soit son tile est CLOSED_DOOR ou OPENED_DOOR.
            board[0][1] = dummyCell(1, 0, Tile.CLOSED_DOOR);
            const result = GameUtils.isPlayerCanMakeAction(board, { x: 1, y: 1 });
            expect(result).toBe(true);
        });

        it('should return false if no neighboring cell is valid for action', () => {
            const board = createBoard(3, 3);
            const result = GameUtils.isPlayerCanMakeAction(board, { x: 1, y: 1 });
            expect(result).toBe(false);
        });
    });

    // Tests pour findPossiblePaths
    describe('findPossiblePaths', () => {
        it('should return reachable paths within movement points and not include starting cell', () => {
            const board = createBoard(3, 3);
            const movementPoints = 2;
            const paths = GameUtils.findPossiblePaths(board, { x: 1, y: 1 }, movementPoints);
            expect(paths.size).toBeGreaterThan(0);
            expect(paths.has('1,1')).toBe(false);
        });
    });

    // Tests pour findValidSpawn
    describe('findValidSpawn', () => {
        it('should return a valid spawn cell from the start position', () => {
            const board = createBoard(3, 3);
            // Marquer la cellule (2,2) comme spawn valide
            board[2][2] = dummyCell(2, 2, Tile.FLOOR, Avatar.Default, 1, Item.SPAWN);
            const spawn = GameUtils.findValidSpawn(board, { x: 2, y: 2 });
            expect(spawn).toEqual({ x: 2, y: 2 });
        });

        it('should return null if no valid spawn cell is found', () => {
            const board = createBoard(3, 3, Tile.WALL);
            const spawn = GameUtils.findValidSpawn(board, { x: 1, y: 1 });
            expect(spawn).toBeNull();
        });
    });

    // Tests pour sortPlayersBySpeed
    describe('sortPlayersBySpeed', () => {
        it('should sort players in descending order of speed', () => {
            const players: Player[] = [{ speed: 5 } as Player, { speed: 10 } as Player, { speed: 7 } as Player];
            const sorted = GameUtils.sortPlayersBySpeed(players);
            expect(sorted[0].speed).toBe(10);
            expect(sorted[1].speed).toBe(7);
            expect(sorted[2].speed).toBe(5);
        });
    });

    // Tests pour getAllSpawnPoints
    describe('getAllSpawnPoints', () => {
        it('should return coordinates for all spawn cells in the board', () => {
            const board = createBoard(3, 3);
            board[0][0].item = Item.SPAWN;
            board[2][2].item = Item.SPAWN;
            const spawnPoints = GameUtils.getAllSpawnPoints(board);
            expect(spawnPoints).toEqual([
                { x: 0, y: 0 },
                { x: 2, y: 2 },
            ]);
        });
    });

    // Tests pour assignSpawnPoints
    describe('assignSpawnPoints', () => {
        it('should assign spawn points to players and update the map', () => {
            const players: Player[] = [
                { speed: 5, avatar: Avatar.Berserker, spawnPosition: null, position: null } as Player,
                { speed: 7, avatar: Avatar.Cleric, spawnPosition: null, position: null } as Player,
            ];
            const spawnPoints: Vec2[] = [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ];
            const board = createBoard(3, 3);
            board[0][0].item = Item.SPAWN;
            board[1][1].item = Item.SPAWN;
            const usedSpawnPoints = GameUtils.assignSpawnPoints(players, spawnPoints, board);
            expect(usedSpawnPoints.length).toBe(2);
            expect(players[0].spawnPosition).toBeDefined();
            expect(players[0].position).toBeDefined();
            expect(players[1].spawnPosition).toBeDefined();
            expect(players[1].position).toBeDefined();
            const cellA = board[spawnPoints[0].y][spawnPoints[0].x].player;
            const cellB = board[spawnPoints[1].y][spawnPoints[1].x].player;
            expect([Avatar.Berserker, Avatar.Cleric]).toContain(cellA);
            expect([Avatar.Berserker, Avatar.Cleric]).toContain(cellB);
        });
    });

    // Tests pour removeUnusedSpawnPoints
    describe('removeUnusedSpawnPoints', () => {
        it('should update cells not used as spawn points to have item DEFAULT', () => {
            const board = createBoard(3, 3);
            board[0][0].item = Item.SPAWN;
            board[1][1].item = Item.SPAWN;
            const usedSpawnPoints: Vec2[] = [{ x: 0, y: 0 }];
            GameUtils.removeUnusedSpawnPoints(board, usedSpawnPoints);
            expect(board[0][0].item).toBe(Item.SPAWN);
            expect(board[1][1].item).toBe(Item.DEFAULT);
        });
    });

    // Tests pour les méthodes privées via accès par crochets
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
            const cell = dummyCell(0, 0, Tile.FLOOR, Avatar.Cleric, 1);
            const result = GameUtils['isOccupiedByPlayer'](cell);
            expect(result).toBe(true);
        });

        it('isValidSpawn should return true if cell is valid for spawn', () => {
            const cell = dummyCell(0, 0, Tile.FLOOR, Avatar.Default, 1);
            const result = GameUtils['isValidSpawn'](cell);
            expect(result).toBe(true);
        });

        it('isValidCellForAction should return true if cell has a non-default player or is a door', () => {
            const cell1 = dummyCell(0, 0, Tile.FLOOR, Avatar.Cleric, 1);
            expect(GameUtils['isValidCellForAction'](cell1)).toBe(true);
            const cell2 = dummyCell(0, 0, Tile.CLOSED_DOOR, undefined, 1);
            expect(GameUtils['isValidCellForAction'](cell2)).toBe(true);
            const cell3 = dummyCell(0, 0, Tile.OPENED_DOOR, undefined, 1);
            expect(GameUtils['isValidCellForAction'](cell3)).toBe(true);
            const cell4 = dummyCell(0, 0, Tile.FLOOR, Avatar.Default, 1);
            expect(GameUtils['isValidCellForAction'](cell4)).toBe(false);
        });

        it('getTileCost should return Infinity if cell is missing or occupied', () => {
            // Si cell est null
            expect(GameUtils['getTileCost'](null)).toBe(Infinity);
            // Si cell est occupée par un joueur non Default
            const cell = dummyCell(0, 0, Tile.FLOOR, Avatar.Cleric, 2);
            expect(GameUtils['getTileCost'](cell)).toBe(Infinity);
        });

        it('getTileCost should return the cost from TILE_COST if defined, otherwise cell.cost, when cell is not occupied', () => {
            const cell = dummyCell(0, 0, Tile.FLOOR, undefined, 3);
            const tileCost = TILE_COST.get(Tile.FLOOR);
            const expected = tileCost !== undefined ? tileCost : cell.cost;
            expect(GameUtils['getTileCost'](cell)).toBe(expected);
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
            board[0][1] = dummyCell(1, 0, Tile.FLOOR, Avatar.Cleric);
            board[1][0] = dummyCell(0, 1, Tile.FLOOR, Avatar.Cleric);
            board[1][2] = dummyCell(2, 1, Tile.FLOOR, Avatar.Cleric);
            board[2][1] = dummyCell(1, 2, Tile.FLOOR, Avatar.Cleric);
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
});
