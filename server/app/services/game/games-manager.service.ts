import { Fight } from '@app/class/fight';
import { Game } from '@app/class/game';
import { Room } from '@app/class/room';
import { Board } from '@app/model/database/board';
import { BoardService } from '@app/services/board/board.service';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

const minNumber = 1000;
const maxNumber = 9000;

@Injectable()
export class GameManagerService {
    private readonly logger = new Logger(GameManagerService.name);
    private gameRooms: Map<string, Room> = new Map();

    constructor(
        private readonly globalEmitter: EventEmitter2,
        private readonly boardService: BoardService,
    ) {}

    async openRoom(organizerId: string, mapName: string): Promise<Room> {
        const accessCode = this.generateUniqueAccessCode();
        const board: Board = await this.boardService.getBoard(mapName);
        const room: Room = new Room(this.globalEmitter, accessCode, organizerId, board);
        this.gameRooms.set(accessCode, room);
        this.logger.log(`Room created with access code: ${accessCode} by organizer: ${organizerId}`);
        return room;
    }

    closeRoom(accessCode: string): void {
        if (this.gameRooms.has(accessCode)) {
            const room = this.getRoom(accessCode);
            room.closeRoom();
            this.gameRooms.delete(accessCode);
            this.logger.log(`Room with access code ${accessCode} has been closed.`);
            return;
        }
        this.logger.error(`Room with access code ${accessCode} not found for closing.`);
    }

    getRoom(accessCode: string): Room {
        return this.gameRooms.get(accessCode);
    }

    getGame(accessCode: string): Game {
        return this.getRoom(accessCode).game;
    }

    getFight(accessCode: string): Fight {
        return this.getGame(accessCode).fight;
    }

    private generateUniqueAccessCode(): string {
        let code: string;
        do {
            code = Math.floor(minNumber + Math.random() * maxNumber).toString();
        } while (this.gameRooms.has(code));
        return code;
    }
}
