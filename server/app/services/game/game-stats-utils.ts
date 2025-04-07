import { PlayerStats } from '@common/player';
import { GameStats } from '@common/game';
import { Stats } from '@common/stats';

export class GameStatsUtils {
    private static readonly minutesMilliseconds = 60000;
    private static readonly secondsMilliseconds = 1000;
    private static readonly timeThreshold = 10;

    static calculateStats(playersStats: PlayerStats[], gameStats: GameStats): Stats {
        const stats: Stats = {
            playersStats: this.calculatePlayersStats(playersStats, gameStats.tilesNumber),
            gameStats: this.calculateGameStats(gameStats, playersStats),
            disconnectedPlayersStats: this.calculatePlayersStats(gameStats.disconnectedPlayers, gameStats.tilesNumber),
        };
        return stats;
    }

    private static calculateGameDuration(gameStats: GameStats): void {
        const gameDuration = gameStats.startOfGame.getTime() - gameStats.startOfGame.getTime();
        const minutes = Math.floor(gameDuration / this.minutesMilliseconds);
        const seconds = Math.floor((gameDuration % this.minutesMilliseconds) / this.secondsMilliseconds);

        const minutesFormat = `${minutes < this.timeThreshold ? '0' + minutes : minutes}`;
        const secondsFormat = `${seconds < this.timeThreshold ? '0' + seconds : seconds}`;

        gameStats.gameDuration = `${minutesFormat}:${secondsFormat}`;

        gameStats.startOfGame = undefined;
        gameStats.endOfGame = undefined;
    }

    private static calculatePlayersStats(playersStats: PlayerStats[], tilesNumber: number): PlayerStats[] {
        return playersStats.map((player) => {
            player.totalFights = player.wins + player.losses + player.fleeSuccess;
            player.itemsPickedCount = player.itemsPicked.size;
            player.tilesVisitedPercentage = player.tilesVisited.size / (tilesNumber * tilesNumber);

            player.itemsPicked = undefined;
            player.tilesVisited = undefined;

            return player;
        });
    }

    private static calculateGameStats(gameStats: GameStats, playersStats: PlayerStats[]): GameStats {
        playersStats.forEach((player) => {
            player.tilesVisited.forEach((tile) => {
                gameStats.tilesVisited.add(tile);
            });
        });
        gameStats.tilesVisitedPercentage = gameStats.tilesVisited.size / gameStats.tilesNumber;
        gameStats.doorsHandledPercentage = gameStats.doorsHandled.size / gameStats.doorsNumber;
        gameStats.flagsCapturedCount = gameStats.flagsCaptured.size;
        this.calculateGameDuration(gameStats);

        gameStats.tilesVisited = undefined;
        gameStats.doorsHandled = undefined;
        gameStats.flagsCaptured = undefined;

        return gameStats;
    }
}
