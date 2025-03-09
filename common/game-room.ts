import { PlayerStats } from './player';

export interface GameRoom {
    accessCode: string;
    organizerId: string;
    players: PlayerStats[];
    isLocked: boolean;
    mapSize: number;
}
