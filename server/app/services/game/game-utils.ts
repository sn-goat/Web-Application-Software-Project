import { Player } from '@app/class/player';
import { RANDOM_SORT_OFFSET } from '@app/gateways/game/game.gateway.constants';
import { Cell, TILE_COST, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar, PathInfo } from '@common/game';
import { DEFAULT_MOVEMENT_DIRECTIONS, DIAGONAL_MOVEMENT_DIRECTIONS, Team } from '@common/player';

export class GameUtils {
    static isPlayerCanMakeAction(map: Cell[][], player: Player): boolean {
        if (player.actions <= 0) {
            return false;
        }
        const directions: Vec2[] = DEFAULT_MOVEMENT_DIRECTIONS;
        for (const dir of directions) {
            const newPos: Vec2 = { x: player.position.x + dir.x, y: player.position.y + dir.y };
            if (newPos.y >= 0 && newPos.y < map.length && newPos.x >= 0 && newPos.x < map[0].length) {
                const targetCell = map[newPos.y][newPos.x];
                if (this.isValidCellForAction(targetCell)) {
                    return true;
                }
            }
        }
        if (player.inventory.includes(Item.Bow)) {
            for (const dir of DIAGONAL_MOVEMENT_DIRECTIONS) {
                const newPos: Vec2 = { x: player.position.x + dir.x, y: player.position.y + dir.y };
                if (newPos.y >= 0 && newPos.y < map.length && newPos.x >= 0 && newPos.x < map[0].length) {
                    const targetCell = map[newPos.y][newPos.x];
                    if (this.isValidCellForAttack(targetCell)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    static findPossiblePaths(game: Cell[][], playerPosition: Vec2, movementPoints: number): Map<string, PathInfo> {
        const directions: Vec2[] = DEFAULT_MOVEMENT_DIRECTIONS;
        const visited = new Map<string, PathInfo>();
        const queue: { position: Vec2; path: Vec2[]; cost: number }[] = [{ position: playerPosition, path: [], cost: 0 }];

        while (queue.length > 0) {
            const { position, path, cost } = queue.shift();
            if (cost > movementPoints) continue;
            const key = this.vec2Key(position);

            if (!visited.has(key) || visited.get(key).cost > cost || (visited.get(key).cost === cost && visited.get(key).path.length > path.length)) {
                visited.set(key, { path, cost });
            }

            for (const dir of directions) {
                const newPos: Vec2 = { x: position.x + dir.x, y: position.y + dir.y };

                if (!this.isValidPosition(game.length, newPos)) {
                    continue;
                }

                const tileCost = this.getTileCost(game[newPos.y][newPos.x], false);
                if (tileCost === Infinity) {
                    continue;
                }

                const newCost = cost + tileCost;
                if (newCost > movementPoints) {
                    continue;
                }

                const newKey = this.vec2Key(newPos);
                const newPath = [...path, newPos];

                if (
                    !visited.has(newKey) ||
                    visited.get(newKey).cost > newCost ||
                    (visited.get(newKey).cost === newCost && visited.get(newKey).path.length > newPath.length)
                ) {
                    queue.push({
                        position: newPos,
                        path: newPath,
                        cost: newCost,
                    });
                }
            }
        }

        visited.delete(this.vec2Key(playerPosition));
        return visited;
    }

    static findValidSpawn(map: Cell[][], start: Vec2): Vec2 | null {
        const rows = map.length;
        const cols = map[0].length;

        const queue: Vec2[] = [start];
        const visited = new Set<string>();
        visited.add(`${start.x},${start.y}`);

        while (queue.length > 0) {
            const current = queue.shift();

            const cell = map[current.y][current.x];
            if (cell && this.isValidSpawn(cell)) {
                return cell.position;
            }

            for (const dir of DIAGONAL_MOVEMENT_DIRECTIONS) {
                const newX = current.x + dir.x;
                const newY = current.y + dir.y;
                const key = `${newX},${newY}`;

                if (newX >= 0 && newX < cols && newY >= 0 && newY < rows && !visited.has(key)) {
                    visited.add(key);
                    queue.push({ x: newX, y: newY });
                }
            }
        }

        return null;
    }

    static sortPlayersBySpeed(players: Player[]): Player[] {
        return players.sort((a, b) => {
            if (a.speed === b.speed) {
                return Math.random() - RANDOM_SORT_OFFSET;
            }
            return b.speed - a.speed;
        });
    }

    static getAllSpawnPoints(map: Cell[][]): Vec2[] {
        const spawnPoints: Vec2[] = [];
        map.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell.item === Item.Spawn) {
                    spawnPoints.push({ x, y });
                }
            });
        });
        return spawnPoints;
    }

    static assignSpawnPoints(players: Player[], spawnPoints: Vec2[], map: Cell[][]): Vec2[] {
        const shuffledSpawnPoints = [...spawnPoints];
        for (let i = shuffledSpawnPoints.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * i);
            [shuffledSpawnPoints[i], shuffledSpawnPoints[j]] = [shuffledSpawnPoints[j], shuffledSpawnPoints[i]];
        }

        const usedSpawnPoints: Vec2[] = [];
        players.forEach((player, index) => {
            if (index < shuffledSpawnPoints.length) {
                player.spawnPosition = shuffledSpawnPoints[index];
                player.position = shuffledSpawnPoints[index];

                const x = shuffledSpawnPoints[index].x;
                const y = shuffledSpawnPoints[index].y;
                map[y][x].player = player.avatar as Avatar;

                usedSpawnPoints.push(shuffledSpawnPoints[index]);
            }
        });

        return usedSpawnPoints;
    }

    static removeUnusedSpawnPoints(map: Cell[][], usedSpawnPoints: Vec2[]): void {
        map.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell.item === Item.Spawn) {
                    const isUsed = usedSpawnPoints.some((point) => point.x === x && point.y === y);
                    if (!isUsed) {
                        cell.item = Item.Default;
                    }
                }
            });
        });
    }
    static assignTeams(playersList: Player[]): void {
        const shuffled = [...playersList];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const mid = Math.floor(shuffled.length / 2);
        for (let i = 0; i < shuffled.length; i++) {
            shuffled[i].setTeam(i < mid ? Team.Red : Team.Blue);
        }
    }

    static normalizeChestItems(map: Cell[][]): void {
        const allItems = Object.values(Item) as Item[];
        const allowed = allItems.filter((item) => item !== Item.Chest && item !== Item.Flag && item !== Item.Spawn);
        const presentAllowed = new Set<Item>();
        map.forEach((row) => {
            row.forEach((cell) => {
                if (cell.item !== Item.Chest && cell.item !== Item.Flag && cell.item !== Item.Spawn && allowed.includes(cell.item)) {
                    presentAllowed.add(cell.item);
                }
            });
        });
        const available = allowed.filter((item) => !presentAllowed.has(item));
        map.forEach((row) => {
            row.forEach((cell) => {
                if (cell.item === Item.Chest) {
                    if (available.length > 0) {
                        const randomIndex = Math.floor(Math.random() * available.length);
                        const newItem = available[randomIndex];
                        cell.item = newItem;
                        available.splice(randomIndex, 1);
                    }
                }
            });
        });
    }

    static canDropItem(cell: Cell): boolean {
        return (
            (cell.player === undefined || cell.player === Avatar.Default || cell.item === Item.Default) &&
            (cell.tile === Tile.Floor || cell.tile === Tile.Ice || cell.tile === Tile.Water || cell.tile === Tile.OpenedDoor)
        );
    }

    static findValidDropCell(map: Cell[][], playerPos: Vec2, droppedItems: { position: Vec2 }[], players: Player[]): Vec2 | null {
        const rows = map.length;
        const cols = map[0].length;
        const queue: Vec2[] = [playerPos];
        const visited = new Set<string>();
        const key = (vec: Vec2) => `${vec.x},${vec.y}`;
        visited.add(key(playerPos));

        while (queue.length > 0) {
            const current = queue.shift();
            if (!(current.x === playerPos.x && current.y === playerPos.y)) {
                const cell = map[current.y]?.[current.x];
                if (
                    cell &&
                    this.canDropItem(cell) &&
                    !droppedItems.some((drop) => drop.position.x === current.x && drop.position.y === current.y) &&
                    !players.some((p) => p.position.x === current.x && p.position.y === current.y)
                ) {
                    return { x: current.x, y: current.y };
                }
            }
            for (const dir of DIAGONAL_MOVEMENT_DIRECTIONS) {
                const newX = current.x + dir.x;
                const newY = current.y + dir.y;
                const newPos: Vec2 = { x: newX, y: newY };
                const newKey = key(newPos);
                if (newX >= 0 && newY >= 0 && newX < cols && newY < rows && !visited.has(newKey)) {
                    visited.add(newKey);
                    queue.push(newPos);
                }
            }
        }
        return null;
    }

    static getTileCost(cell: Cell, ignorePlayerDoors: boolean): number {
        if (!cell) {
            return Infinity;
        }
        if (this.isOccupiedByPlayer(cell)) {
            return ignorePlayerDoors ? 0 : Infinity;
        }
        if (cell.tile === Tile.ClosedDoor) {
            return ignorePlayerDoors ? 1 : TILE_COST.get(cell.tile);
        }
        const cost = TILE_COST.get(cell.tile);
        return cost !== undefined ? cost : cell.cost;
    }

    static isValidCellForAction(cell: Cell): boolean {
        return (cell.player !== undefined && cell.player !== Avatar.Default) || cell.tile === Tile.ClosedDoor || cell.tile === Tile.OpenedDoor;
    }

    static dijkstra(map: Cell[][], start: Vec2, end: Vec2, ignorePlayerDoors: boolean): PathInfo {
        const queue = [{ position: start, path: [], cost: 0 }];
        const visited = new Set<string>();
        visited.add(this.vec2Key(start));

        while (queue.length > 0) {
            const { position, path, cost } = queue.shift();
            if (position.x === end.x && position.y === end.y) {
                const fPath = [...path, position];
                fPath.shift();
                return { path: fPath, cost };
            }

            for (const dir of DEFAULT_MOVEMENT_DIRECTIONS) {
                const newPos: Vec2 = { x: position.x + dir.x, y: position.y + dir.y };

                if (!this.isValidPosition(map.length, newPos)) {
                    continue;
                }
                const tileCost = this.getTileCost(map[newPos.y][newPos.x], ignorePlayerDoors);
                if (tileCost === Infinity) {
                    continue;
                }

                const newCost = cost + tileCost;
                const newKey = this.vec2Key(newPos);
                if (!visited.has(newKey)) {
                    visited.add(newKey);
                    queue.push({ position: newPos, path: [...path, position], cost: newCost });
                }
            }
        }
        return null;
    }

    static isOccupiedByPlayer(cell: Cell): boolean {
        return cell && cell.player !== undefined && cell.player !== Avatar.Default;
    }

    static hasOpponentOnCell(player: Player, players: Player[], cell: Cell): boolean {
        const playerInCell = players.find((p) => p.avatar === cell.player);
        return playerInCell && playerInCell.team !== player.team;
    }

    static isValidPosition(size: number, position: Vec2): boolean {
        return position.y >= 0 && position.y < size && position.x >= 0 && position.x < size;
    }

    static getPlayerWithFlag(players: Player[]): Player | null {
        return players.find((player) => player.hasItem(Item.Flag)) || null;
    }

    private static vec2Key(vec: Vec2): string {
        return `${vec.x},${vec.y}`;
    }

    private static isValidSpawn(cell: Cell): boolean {
        return (
            cell.tile !== Tile.Wall &&
            cell.tile !== Tile.ClosedDoor &&
            cell.tile !== Tile.OpenedDoor &&
            (cell.player === Avatar.Default || cell.player === undefined)
        );
    }

    private static isValidCellForAttack(cell: Cell): boolean {
        return cell.player !== undefined && cell.player !== Avatar.Default;
    }
}
