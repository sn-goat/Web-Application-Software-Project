import { Cell, Vec2 } from '@common/board';
import { Player } from '@app/class/player';
import { VirtualPlayer } from '@app/class/virtual-player';
import { ATTACK_ITEMS, CellEvaluation, DEFENSE_ITEMS, PathInfo, VirtualPlayerAction, VirtualPlayerInstructions } from '@common/game';
import { GameUtils } from '@app/services/game/game-utils';
import { DEFAULT_MOVEMENT_DIRECTIONS, VirtualPlayerStyles } from '@common/player';
import { Item, Tile } from '@common/enums';

export class VPManager {
    private static readonly bonusScoreCell = 2;
    private static readonly flagPriority = 5;
    private static readonly aggressivePriorityPlayer = 2;
    private static readonly aggressivePriorityItem = 1;
    private static readonly defensivePriorityPlayer = 1;
    private static readonly defensivePriorityItem = 2;

    static lookForTarget(player: VirtualPlayer, map: Cell[][], players: Player[]): Vec2[] {
        const queue: Vec2[] = [];
        const visited = new Set<string>();
        visited.add(`${player.position.x},${player.position.y}`);
        this.addNeighborsToQueue(queue, visited, map, player.position);

        let bestScore = -Infinity;
        let bestPath: Vec2[] = [];

        while (queue.length > 0) {
            const current: Vec2 = queue.shift();
            const cell = map[current.y][current.x];
            const evaluation = this.evaluateCell(player, players, map, cell);
            if (evaluation.score > bestScore && evaluation.path !== null) {
                bestScore = evaluation.score;
                bestPath = evaluation.path;
            }
            this.addNeighborsToQueue(queue, visited, map, current);
        }

        return bestPath;
    }

    static lookForFlag(player: VirtualPlayer, map: Cell[][], playerWithFlag: Player): Vec2[] {
        if (player.virtualStyle === VirtualPlayerStyles.Defensive) {
            const validSpawnPosition: Vec2 = GameUtils.findValidSpawn(map, playerWithFlag.spawnPosition);
            return GameUtils.dijkstra(map, player.position, validSpawnPosition, true).path;
        } else {
            return GameUtils.dijkstra(map, player.position, playerWithFlag.position, true).path;
        }
    }

    static computePath(vPlayer: VirtualPlayer, map: Cell[][], targetPath: Vec2[]): VirtualPlayerInstructions {
        const defaultAction: VirtualPlayerAction = VirtualPlayerAction.Move;
        const pathInfo: PathInfo = { path: [], cost: 0 };
        for (const position of targetPath) {
            const cell = map[position.y][position.x];
            const action = this.getEventAction(cell);
            if (action !== VirtualPlayerAction.Move) {
                if (!(pathInfo.path.length === 0)) break;
                return vPlayer.actions > 0 ? { action, target: cell.position } : { action: VirtualPlayerAction.EndTurn };
            } else {
                const cellCost = GameUtils.getTileCost(cell, true);
                if (vPlayer.movementPts < pathInfo.cost + cellCost) break;
                pathInfo.path.push(position);
                pathInfo.cost += cellCost;
            }
        }
        return pathInfo.path.length === 0 ? { action: VirtualPlayerAction.EndTurn } : { action: defaultAction, pathInfo };
    }

    static processFightAction(vPlayer: VirtualPlayer): VirtualPlayerAction {
        const wantToFlee = vPlayer.virtualStyle === VirtualPlayerStyles.Defensive && vPlayer.currentLife < vPlayer.life && vPlayer.fleeAttempts > 0;
        if (wantToFlee) {
            return VirtualPlayerAction.Flee;
        }
        return VirtualPlayerAction.Attack;
    }

    private static getEventAction(cell: Cell): VirtualPlayerAction {
        if (cell.tile === Tile.ClosedDoor) {
            return VirtualPlayerAction.OpenDoor;
        } else if (GameUtils.isOccupiedByPlayer(cell)) {
            return VirtualPlayerAction.InitFight;
        }
        return VirtualPlayerAction.Move;
    }

    private static evaluateCell(vPlayer: VirtualPlayer, players: Player[], map: Cell[][], cell: Cell): CellEvaluation {
        let score = 0;
        if (!this.isInterestingCell(vPlayer, players, cell)) {
            return { score: 0, path: [] };
        }
        const pathInfo = GameUtils.dijkstra(map, vPlayer.position, cell.position, true);
        if (cell.item === Item.Flag) {
            return { score: this.flagPriority, path: pathInfo.path };
        }
        score += pathInfo.cost <= vPlayer.movementPts ? this.bonusScoreCell : 0;
        if (vPlayer.virtualStyle === VirtualPlayerStyles.Aggressive) {
            score += ATTACK_ITEMS.has(cell.item) ? this.aggressivePriorityItem : this.aggressivePriorityPlayer;
        } else {
            score += DEFENSE_ITEMS.has(cell.item) ? this.defensivePriorityItem : this.defensivePriorityPlayer;
        }
        return { score, path: pathInfo.path };
    }

    private static isInterestingCell(vPlayer: VirtualPlayer, players: Player[], cell: Cell): boolean {
        const hasPlayer = vPlayer.team ? GameUtils.hasOpponentOnCell(vPlayer, players, cell) : GameUtils.isOccupiedByPlayer(cell);
        const hasItem = vPlayer.virtualStyle === VirtualPlayerStyles.Aggressive ? ATTACK_ITEMS.has(cell.item) : DEFENSE_ITEMS.has(cell.item);
        return (hasPlayer && cell.player !== vPlayer.avatar) || hasItem;
    }

    private static addNeighborsToQueue(queue: Vec2[], visited: Set<string>, map: Cell[][], position: Vec2) {
        for (const direction of DEFAULT_MOVEMENT_DIRECTIONS) {
            const newPos: Vec2 = { x: position.x + direction.x, y: position.y + direction.y };
            if (GameUtils.isValidPosition(map.length, newPos) && !visited.has(`${newPos.x},${newPos.y}`)) {
                visited.add(`${newPos.x},${newPos.y}`);
                queue.push(newPos);
            }
        }
    }
}
