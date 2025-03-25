import { Game } from '@app/class/game';
import { Cell } from '@common/board';
import { IRoom } from '@common/game';

export class Room implements IRoom {
    accessCode: string;
    organizerId: string;
    isLocked: boolean;
    game: Game;

    constructor(accessCode: string, organizerId: string, map: Cell[][]) {
        this.accessCode = accessCode;
        this.organizerId = organizerId;
        this.isLocked = false;
        this.game = new Game(accessCode, map);
    }

    setLock(isLocked: boolean): void {
        this.isLocked = isLocked;
    }

    isPlayerAdmin(playerId: string): boolean {
        return this.organizerId === playerId;
    }
}
