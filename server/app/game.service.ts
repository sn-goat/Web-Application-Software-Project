import { Injectable, Logger } from '@nestjs/common';

export interface Player {
    id: string;
    name: string;
    avatar: string;
}

export interface GameRoom {
    accessCode: string;
    organizerId: string;
    players: Player[];
    isLocked: boolean;
}
const minNumber = 1000;
const maxNumber = 9000;

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);
    private gameRooms: Map<string, GameRoom> = new Map();

    createGame(organizerId: string): GameRoom {
        const accessCode = this.generateUniqueAccessCode();
        const newRoom: GameRoom = {
            accessCode,
            organizerId,
            players: [],
            isLocked: false,
        };
        this.gameRooms.set(accessCode, newRoom);
        this.logger.log(`Game room created with access code: ${accessCode} by organizer: ${organizerId}`);
        return newRoom;
    }

    joinGame(accessCode: string, player: Player): GameRoom | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found.`);
            return null;
        }
        if (room.isLocked) {
            this.logger.error(`Room with access code ${accessCode} is locked.`);
            return null;
        }
        const existing = room.players.find((p) => p.name === player.name);
        if (existing) {
            player.name = `${player.name}-2`;
        }
        room.players.push(player);
        this.logger.log(`Player ${player.id} joined room ${accessCode}`);
        return room;
    }

    lockRoom(accessCode: string): GameRoom | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found for locking.`);
            return null;
        }
        room.isLocked = true;
        this.logger.log(`Room ${accessCode} is now locked.`);
        return room;
    }

    unlockRoom(accessCode: string): GameRoom | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found for unlocking.`);
            return null;
        }
        room.isLocked = false;
        this.logger.log(`Room ${accessCode} is now unlocked.`);
        return room;
    }

    startGame(accessCode: string): GameRoom | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found for starting game.`);
            return null;
        }
        if (!room.isLocked) {
            this.logger.error(`Room ${accessCode} must be locked to start the game.`);
            return null;
        }
        this.logger.log(`Game started for room ${accessCode}`);
        return room;
    }

    submitMove(accessCode: string, playerId: string, move: any): GameRoom | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found for move submission.`);
            return null;
        }
        this.logger.log(`Player ${playerId} submitted move ${JSON.stringify(move)} in room ${accessCode}`);
        return room;
    }

    private generateUniqueAccessCode(): string {
        let code: string;
        do {
            code = Math.floor(minNumber + Math.random() * maxNumber).toString();
        } while (this.gameRooms.has(code));
        return code;
    }
}
