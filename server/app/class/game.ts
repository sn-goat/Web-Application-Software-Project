import { Cell } from '@common/board';
import { Player } from '@app/class/player';
import { getLobbyLimit } from '@common/lobby-limits';
import { Fight } from '@app/class/fight';
import { IGame, PathInfo } from '@common/game';
import { GameUtils } from '@app/services/game/game-utils';
import { Timer } from './timer';

export class Game implements IGame {
    map: Cell[][];
    players: Player[];
    currentTurn: number;
    hasStarted: boolean;
    isDebugMode: boolean;
    fight: Fight;
    timer: Timer;

    constructor(accessCode: string, map: Cell[][]) {
        this.map = map;
        this.players = [];
        this.currentTurn = 0;
        this.hasStarted = false;
        this.isDebugMode = false;
        this.timer = new Timer(accessCode);
        this.fight = null;
    }

    addPlayer(player: Player): void {
        this.players.push(player);
    }

    removePlayer(playerId: string): void {
        const index = this.players.findIndex((p) => p.id === playerId);
        if (index < 0) {
            return;
        }
        this.players.splice(index, 1);
    }

    getMapSize(): number {
        return this.map.length;
    }
    getTimer(): Timer {
        return this.timer;
    }

    isGameFull(): boolean {
        return this.players.length >= getLobbyLimit(this.getMapSize());
    }

    configureGame(): Game {
        this.players = GameUtils.sortPlayersBySpeed(this.players);
        const allSpawns = GameUtils.getAllSpawnPoints(this.map);
        const usedSpawnPoints = GameUtils.assignSpawnPoints(this.players, allSpawns, this.map);
        GameUtils.removeUnusedSpawnPoints(this.map, usedSpawnPoints);
        return this;
    }

    configureTurn(): { player: Player; path: Record<string, PathInfo> } {
        const player = this.players[this.currentTurn];
        player.initTurn();
        const path = GameUtils.findPossiblePaths(this.map, player.position, player.movementPts);
        return { player, path: Object.fromEntries(path) };
    }
}
