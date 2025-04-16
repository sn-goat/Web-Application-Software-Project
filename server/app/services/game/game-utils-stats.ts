import { PlayerStats } from '@common/player';
import { GameStats } from '@common/game';
import { Stats } from '@common/stats';
import { Item } from '@common/enums';

export class GameStatsUtils {
    private static readonly minutesMilliseconds = 60000;
    private static readonly secondsMilliseconds = 1000;
    private static readonly timeThreshold = 10;
    private static readonly hundredPercent = 100;

    static calculateStats(playersStats: PlayerStats[], gameStats: GameStats): Stats {
        const stats: Stats = {
            playersStats: this.calculatePlayersStats(playersStats, gameStats.tilesNumber),
            disconnectedPlayersStats: this.calculatePlayersStats(gameStats.disconnectedPlayers, gameStats.tilesNumber),
            gameStats: this.calculateGameStats(gameStats, playersStats),
        };

        const serializableStats = {
            playersStats: stats.playersStats.map((player) => ({
                name: player.name,
                fleeSuccess: player.fleeSuccess,
                givenDamage: player.givenDamage,
                takenDamage: player.takenDamage,
                wins: player.wins,
                losses: player.losses,
                tilesVisitedPercentage: player.tilesVisitedPercentage,
                totalFights: player.totalFights,
                itemsPickedCount: player.itemsPickedCount,
            })),
            disconnectedPlayersStats: stats.disconnectedPlayersStats.map((player) => ({
                name: player.name,
                fleeSuccess: player.fleeSuccess,
                givenDamage: player.givenDamage,
                takenDamage: player.takenDamage,
                wins: player.wins,
                losses: player.losses,
                tilesVisitedPercentage: player.tilesVisitedPercentage,
                totalFights: player.totalFights,
                itemsPickedCount: player.itemsPickedCount,
            })),
            gameStats: {
                doorsHandledPercentage: stats.gameStats.doorsHandledPercentage,
                gameDuration: stats.gameStats.gameDuration,
                tilesVisitedPercentage: stats.gameStats.tilesVisitedPercentage,
                flagsCapturedCount: stats.gameStats.flagsCapturedCount,
                totalTurns: stats.gameStats.totalTurns,
            },
        };

        return serializableStats;
    }

    private static calculateGameDuration(gameStats: GameStats): void {
        const gameDuration = gameStats.timeEndOfGame.getTime() - gameStats.timeStartOfGame.getTime();
        const minutes = Math.floor(gameDuration / this.minutesMilliseconds);
        const seconds = Math.floor((gameDuration % this.minutesMilliseconds) / this.secondsMilliseconds);

        const minutesFormat = `${minutes < this.timeThreshold ? '0' + minutes : minutes}`;
        const secondsFormat = `${seconds < this.timeThreshold ? '0' + seconds : seconds}`;

        gameStats.gameDuration = `${minutesFormat}:${secondsFormat}`;
    }

    private static calculatePlayersStats(playersStats: PlayerStats[], tilesNumber: number): PlayerStats[] {
        return playersStats.map((player) => {
            player.totalFights = player.wins + player.losses + player.fleeSuccess + player.totalFights;
            player.itemsPickedCount = player.itemsPicked.size > 0 ? player.itemsPicked.size : 0;
            player.tilesVisitedPercentage = `${Math.round((player.tilesVisited.size / tilesNumber) * this.hundredPercent)}%`;

            return player;
        });
    }

    private static addVisitedTileToGameStats(playersStats: PlayerStats[], gameStats: GameStats): void {
        playersStats.forEach((player) => {
            player.tilesVisited.forEach((pos) => {
                gameStats.tilesVisited.set(`${pos.x},${pos.y}`, pos);
            });
            player.tilesVisited.clear();
        });
    }

    private static addFlagsCapturedToGameStats(playersStats: PlayerStats[], gameStats: GameStats): void {
        playersStats.forEach((player) => {
            player.itemsPicked.forEach((value) => {
                if (value === Item.Flag) {
                    if (!gameStats.flagsCaptured.has(player.name)) {
                        gameStats.flagsCaptured.add(player.name);
                    }
                }
            });
            player.itemsPicked.clear();
        });
    }

    private static calculateGameStats(gameStats: GameStats, playersStats: PlayerStats[]): GameStats {
        this.addVisitedTileToGameStats(playersStats, gameStats);
        this.addVisitedTileToGameStats(gameStats.disconnectedPlayers, gameStats);
        this.addFlagsCapturedToGameStats(playersStats, gameStats);
        this.addFlagsCapturedToGameStats(gameStats.disconnectedPlayers, gameStats);

        gameStats.tilesVisitedPercentage = `${Math.round((gameStats.tilesVisited.size / gameStats.tilesNumber) * this.hundredPercent)}%`;
        gameStats.doorsHandledPercentage =
            gameStats.doorsNumber > 0 ? `${Math.round((gameStats.doorsHandled.size / gameStats.doorsNumber) * this.hundredPercent)}%` : '0%';
        gameStats.flagsCapturedCount = gameStats.flagsCaptured.size > 0 ? gameStats.flagsCaptured.size : 0;

        this.calculateGameDuration(gameStats);

        gameStats.tilesVisited.clear();
        gameStats.doorsHandled.clear();
        gameStats.flagsCaptured.clear();

        return gameStats;
    }
}
