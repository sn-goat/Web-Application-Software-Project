import { Player } from './player';

export interface GameRoom {
    accessCode: string;
    organizerId: string;
    players: Player[];
    isLocked: boolean;
    mapSize: number;
}
