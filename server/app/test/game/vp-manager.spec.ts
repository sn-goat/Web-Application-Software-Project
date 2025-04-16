/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable max-params */
/* eslint-disable max-lines */
import { Player } from '@app/class/player';
import { VPManager } from '@app/class/utils/vp-manager';
import { VirtualPlayer } from '@app/class/virtual-player';
import { GameUtils } from '@app/services/game/game-utils';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar, VirtualPlayerAction } from '@common/game';
import { PlayerInput, Team, VirtualPlayerStyles } from '@common/player';

describe('VPManager', () => {
    // Mocks
    let mockMap: Cell[][];
    let mockVirtualPlayer: VirtualPlayer;
    let mockPlayers: Player[];

    // Helper pour créer une cellule
    function createCell(x: number, y: number, tile: Tile = Tile.Floor, item: Item = Item.Default, player: Avatar = Avatar.Default): Cell {
        return {
            position: { x, y },
            tile,
            item,
            player,
            cost: 1,
        };
    }

    beforeEach(() => {
        // Créer une carte mock 3x3
        mockMap = [
            [createCell(0, 0), createCell(1, 0), createCell(2, 0)],
            [createCell(0, 1), createCell(1, 1), createCell(2, 1)],
            [createCell(0, 2), createCell(1, 2), createCell(2, 2)],
        ];

        // Créer un joueur virtuel mock
        mockVirtualPlayer = {
            position: { x: 1, y: 1 },
            movementPts: 5,
            actions: 1,
            virtualStyle: VirtualPlayerStyles.Aggressive,
            avatar: Avatar.Default,
            team: null,
            life: 10,
            currentLife: 8,
            fleeAttempts: 1,
        } as VirtualPlayer;

        // Créer des joueurs mock
        mockPlayers = [{ avatar: Avatar.Default, position: { x: 2, y: 2 } } as Player];

        // Mock des méthodes GameUtils
        jest.spyOn(GameUtils, 'isValidPosition').mockImplementation((size, pos) => pos.x >= 0 && pos.x < size && pos.y >= 0 && pos.y < size);

        jest.spyOn(GameUtils, 'isOccupiedByPlayer').mockImplementation((cell) => cell.player !== Avatar.Default);

        jest.spyOn(GameUtils, 'dijkstra').mockImplementation((_, start, end) => {
            return {
                path: [start, end],
                cost: 1,
            };
        });

        jest.spyOn(GameUtils, 'getTileCost').mockReturnValue(1);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('lookForTarget', () => {
        it('devrait trouver un chemin vers un joueur pour un joueur agressif', () => {
            // Configurer une carte avec un joueur cible
            mockMap[0][0].player = Avatar.Default;

            const result = VPManager.lookForTarget(mockVirtualPlayer, mockMap, mockPlayers);

            expect(result).toBeDefined();
        });

        it('devrait prioriser le drapeau par rapport aux autres éléments', () => {
            mockMap[0][0].item = Item.Flag;
            mockMap[2][2].item = Item.Sword;

            const dijkstraSpy = jest.spyOn(GameUtils, 'dijkstra').mockImplementation((_, start, end) => {
                return {
                    path: [start, end],
                    cost: Math.abs(end.x - start.x) + Math.abs(end.y - start.y),
                };
            });

            const result = VPManager.lookForTarget(mockVirtualPlayer, mockMap, mockPlayers);

            expect(dijkstraSpy).toHaveBeenCalled();
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('computePath', () => {
        it('devrait retourner une action de déplacement quand un chemin valide existe', () => {
            const targetPath = [
                { x: 1, y: 0 },
                { x: 2, y: 0 },
            ];

            const result = VPManager.computePath(mockVirtualPlayer, mockMap, targetPath);

            expect(result.action).toBe(VirtualPlayerAction.Move);
            expect(result.pathInfo).toBeDefined();
            expect(result.pathInfo.path).toEqual(targetPath);
        });

        it('devrait limiter le chemin en fonction des points de mouvement', () => {
            mockVirtualPlayer.movementPts = 1;
            const targetPath = [
                { x: 1, y: 0 }, // Coût 1
                { x: 2, y: 0 }, // Coût 1 (dépasse les points de mouvement)
            ];

            const result = VPManager.computePath(mockVirtualPlayer, mockMap, targetPath);

            expect(result.action).toBe(VirtualPlayerAction.Move);
            expect(result.pathInfo.path).toEqual([{ x: 1, y: 0 }]);
        });

        it("devrait retourner une action d'ouverture de porte quand une porte est sur le chemin", () => {
            mockMap[1][0].tile = Tile.ClosedDoor;
            const targetPath = [{ x: 0, y: 1 }];

            const result = VPManager.computePath(mockVirtualPlayer, mockMap, targetPath);

            expect(result.action).toBe(VirtualPlayerAction.OpenDoor);
            expect(result.target).toEqual({ x: 0, y: 1 });
        });

        it("devrait retourner une action de fin de tour quand aucun chemin valide n'existe", () => {
            const result = VPManager.computePath(mockVirtualPlayer, mockMap, []);

            expect(result.action).toBe(VirtualPlayerAction.EndTurn);
        });
    });

    describe('processFightAction', () => {
        it('devrait retourner Attack pour un joueur agressif', () => {
            mockVirtualPlayer.virtualStyle = VirtualPlayerStyles.Aggressive;
            const action = VPManager.processFightAction(mockVirtualPlayer);
            expect(action).toBe(VirtualPlayerAction.Attack);
        });

        it('devrait retourner Flee pour un joueur défensif avec une santé endommagée', () => {
            mockVirtualPlayer.virtualStyle = VirtualPlayerStyles.Defensive;
            mockVirtualPlayer.currentLife = mockVirtualPlayer.life - 1;
            mockVirtualPlayer.fleeAttempts = 1;

            const action = VPManager.processFightAction(mockVirtualPlayer);

            expect(action).toBe(VirtualPlayerAction.Flee);
        });

        it("devrait retourner Attack si aucune tentative de fuite n'est disponible", () => {
            mockVirtualPlayer.virtualStyle = VirtualPlayerStyles.Defensive;
            mockVirtualPlayer.currentLife = mockVirtualPlayer.life - 1;
            mockVirtualPlayer.fleeAttempts = 0;

            const action = VPManager.processFightAction(mockVirtualPlayer);

            expect(action).toBe(VirtualPlayerAction.Attack);
        });
    });

    describe('getInstruction', () => {
        let map: Cell[][];
        let players: Player[];
        let vPlayer: VirtualPlayer;

        beforeEach(() => {
            // Mock map with a single tile
            map = [[{ tile: Tile.Floor, item: Item.Default, position: { x: 0, y: 0 }, player: null } as Cell]];

            // Create 2 dummy players with basic PlayerInput
            const playerInput1 = { name: 'Ally', avatar: 'avatar1' } as PlayerInput;
            const playerInput2 = { name: 'Enemy', avatar: 'avatar2' } as PlayerInput;

            const ally = new Player('p1', playerInput1);
            const enemy = new Player('p2', playerInput2);
            ally.team = Team.Blue;
            enemy.team = Team.Red;

            players = [ally, enemy];

            // VirtualPlayer constructor will internally randomize, so we pass dummy player list + style
            vPlayer = new VirtualPlayer(players, VirtualPlayerStyles.Aggressive);
            vPlayer.team = Team.Blue; // Force a team for tests
        });

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('should chase enemy flag holder in CTF mode', () => {
            const enemy = players[1];
            jest.spyOn(GameUtils, 'getPlayerWithFlag').mockReturnValueOnce(enemy);
            jest.spyOn(VPManager, 'lookForFlag').mockReturnValue([{ x: 1, y: 1 }]);
            jest.spyOn(VPManager, 'computePath').mockReturnValue({ action: VirtualPlayerAction.Move, pathInfo: { path: [{ x: 1, y: 1 }], cost: 1 } });

            const result = VPManager.getInstruction(vPlayer, true, players, map);

            expect(result).toEqual({
                action: VirtualPlayerAction.Move,
                pathInfo: { path: [{ x: 1, y: 1 }], cost: 1 },
            });
        });

        it('should return EndTurn if flag cannot be reached in CTF mode', () => {
            const enemy = players[1];
            jest.spyOn(GameUtils, 'getPlayerWithFlag').mockReturnValueOnce(enemy);
            jest.spyOn(VPManager, 'lookForFlag').mockReturnValue([]);

            const result = VPManager.getInstruction(vPlayer, true, players, map);

            expect(result).toEqual({ action: VirtualPlayerAction.EndTurn });
        });

        it('should look for regular target if not in CTF mode', () => {
            jest.spyOn(VPManager, 'lookForTarget').mockReturnValue([{ x: 2, y: 2 }]);
            jest.spyOn(VPManager, 'computePath').mockReturnValue({ action: VirtualPlayerAction.Move, pathInfo: { path: [{ x: 2, y: 2 }], cost: 1 } });

            const result = VPManager.getInstruction(vPlayer, false, players, map);

            expect(result).toEqual({
                action: VirtualPlayerAction.Move,
                pathInfo: { path: [{ x: 2, y: 2 }], cost: 1 },
            });
        });

        it('should look for regular target if flag holder is ally', () => {
            const ally = players[0];
            jest.spyOn(GameUtils, 'getPlayerWithFlag').mockReturnValueOnce(ally);
            jest.spyOn(VPManager, 'lookForTarget').mockReturnValue([{ x: 3, y: 3 }]);
            jest.spyOn(VPManager, 'computePath').mockReturnValue({ action: VirtualPlayerAction.Move, pathInfo: { path: [{ x: 3, y: 3 }], cost: 1 } });

            const result = VPManager.getInstruction(vPlayer, true, players, map);

            expect(result).toEqual({
                action: VirtualPlayerAction.Move,
                pathInfo: { path: [{ x: 3, y: 3 }], cost: 1 },
            });
        });
    });
    describe('lookForFlag', () => {
        let map: Cell[][];
        let path: Vec2[];

        beforeEach(() => {
            map = [[{ tile: Tile.Floor, item: Item.Default, position: { x: 0, y: 0 }, player: null } as Cell]];
            path = [
                { x: 0, y: 1 },
                { x: 0, y: 2 },
            ];
            jest.resetAllMocks();
        });

        const makePlayer = (name: string, position: Vec2, spawnPosition?: Vec2): Player => {
            const playerInput = { name, avatar: 'avatar1' } as PlayerInput;
            const player = new Player(name, playerInput);
            if (spawnPosition) player.spawnPosition = spawnPosition;
            return player;
        };

        it('should return path to spawn if defensive and not on spawn', () => {
            const vPlayer = new VirtualPlayer([], VirtualPlayerStyles.Defensive);
            vPlayer.position = { x: 2, y: 2 };

            const flagHolder = makePlayer('flagHolder', { x: 1, y: 1 }, { x: 0, y: 0 });

            jest.spyOn(GameUtils, 'findValidSpawn').mockReturnValueOnce({ x: 0, y: 0 });
            jest.spyOn(GameUtils, 'dijkstra').mockReturnValueOnce({ path, cost: 2 });

            const result = VPManager.lookForFlag(vPlayer, map, flagHolder);

            expect(GameUtils.findValidSpawn).toHaveBeenCalledWith(map, flagHolder.spawnPosition);
            expect(GameUtils.dijkstra).toHaveBeenCalledWith(map, vPlayer.position, { x: 0, y: 0 }, true);
            expect(result).toEqual(path);
        });

        it('should return empty path if defensive and already at spawn', () => {
            const vPlayer = new VirtualPlayer([], VirtualPlayerStyles.Defensive);
            vPlayer.position = { x: 0, y: 0 };
            jest.spyOn(GameUtils, 'findValidSpawn');
            jest.spyOn(GameUtils, 'dijkstra');
            const flagHolder = makePlayer('flagHolder', { x: 1, y: 1 }, { x: 0, y: 0 });

            const result = VPManager.lookForFlag(vPlayer, map, flagHolder);

            expect(result).toEqual([]);
            expect(GameUtils.findValidSpawn).not.toHaveBeenCalled();
            expect(GameUtils.dijkstra).not.toHaveBeenCalled();
        });

        it('should return path to flag holder if aggressive', () => {
            const vPlayer = new VirtualPlayer([], VirtualPlayerStyles.Aggressive);
            vPlayer.position = { x: 5, y: 5 };

            const flagHolder = makePlayer('flagHolder', { x: 1, y: 1 });

            (GameUtils.dijkstra as jest.Mock).mockReturnValue({ path });

            const result = VPManager.lookForFlag(vPlayer, map, flagHolder);

            expect(GameUtils.dijkstra).toHaveBeenCalledWith(map, vPlayer.position, flagHolder.position, true);
            expect(result).toEqual(path);
        });
    });
});
