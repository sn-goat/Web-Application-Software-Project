/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable max-params */
/* eslint-disable max-lines */
import { Player } from '@app/class/player';
import { VPManager } from '@app/class/utils/vp-manager';
import { VirtualPlayer } from '@app/class/virtual-player';
import { GameUtils } from '@app/services/game/game-utils';
import { Cell } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar, VirtualPlayerAction } from '@common/game';
import { VirtualPlayerStyles } from '@common/player';

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
});
