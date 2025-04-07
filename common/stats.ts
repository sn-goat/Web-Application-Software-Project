import { PlayerStats } from './player';
import { GameStats } from './game';

export interface Stats {
    playersStats: PlayerStats[];
    disconnectedPlayersStats: PlayerStats[];
    gameStats: GameStats;
}