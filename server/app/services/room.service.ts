import { GameRoom } from '@common/game-room';
import { getLobbyLimit } from '@common/lobby-limits';
import { Player } from '@common/player';
import { Injectable, Logger } from '@nestjs/common';
const minNumber = 1000;
const maxNumber = 9000;

@Injectable()
export class RoomService {
    private readonly logger = new Logger(RoomService.name);
    private gameRooms: Map<string, GameRoom> = new Map();

    createRoom(organizerId: string, size: number): GameRoom {
        const accessCode = this.generateUniqueAccessCode();
        const newRoom: GameRoom = {
            accessCode,
            organizerId,
            players: [],
            isLocked: false,
            mapSize: size,
        };
        this.gameRooms.set(accessCode, newRoom);
        this.logger.log(`GameRoom created with access code: ${accessCode} by organizer: ${organizerId}`);
        return newRoom;
    }

    joinRoom(accessCode: string): GameRoom | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found.`);
            return null;
        }
        if (room.isLocked) {
            this.logger.error(`Room with access code ${accessCode} is locked.`);
            return null;
        }
        this.logger.log(`Player joined room ${accessCode}`);
        return room;
    }

    removePlayer(accessCode: string, playerId: string): GameRoom | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found for player removal.`);
            return null;
        }
        const index = room.players.findIndex((p) => p.id === playerId);
        if (index < 0) {
            this.logger.error(`Player ${playerId} not found in room ${accessCode}`);
            return null;
        }
        room.players.splice(index, 1);
        this.logger.log(`Player ${playerId} removed from room ${accessCode}`);
        return room;
    }

    disconnectPlayer(accessCode: string, playerId: string): GameRoom | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found for player disconnection.`);
            return null;
        }
        if (room.organizerId === playerId) {
            for (let i = room.players.length - 1; i >= 0; i--) {
                const player = room.players[i];
                this.removePlayer(accessCode, player.id);
                this.logger.log(`Player ${player.id} disconnected from room ${accessCode}.`);
            }
            this.deleteRoom(accessCode);
            this.logger.log(`Room ${accessCode} deleted.`);
        } else {
            this.logger.log(`organizerId: ${room.organizerId}, playerId: ${playerId}`);
            this.removePlayer(accessCode, playerId);
            this.logger.log(`Player ${playerId} disconnected from room ${accessCode}.`);
        }
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

    getRoom(accessCode: string): GameRoom | null {
        return this.gameRooms.get(accessCode) || null;
    }

    shareCharacter(accessCode: string, player: Player): GameRoom | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found.`);
            return null;
        }
        const sameNameCount = room.players.filter((p) => p.name === player.name || p.name.startsWith(`${player.name}-`)).length;

        if (sameNameCount > 0) {
            player.name = `${player.name}-${sameNameCount + 1}`;
        }

        room.players.push(player);
        this.logger.log(`Player ${player.id} joined room ${accessCode}`);

        const maxPlayers = getLobbyLimit(room.mapSize);
        this.logger.log(`Room ${accessCode} has ${room.players.length} players. Max players allowed: ${maxPlayers}`);

        if (maxPlayers && room.players.length >= maxPlayers) {
            room.isLocked = true;
            this.logger.log(`Room ${accessCode} is now locked (max players reached).`);
        }

        return room;
    }

    deleteRoom(accessCode: string): void {
        if (this.gameRooms.has(accessCode)) {
            this.gameRooms.delete(accessCode);
            this.logger.log(`Room with access code ${accessCode} has been deleted.`);
        } else {
            this.logger.error(`Room with access code ${accessCode} not found for deletion.`);
        }
    }

    private generateUniqueAccessCode(): string {
        let code: string;
        do {
            code = Math.floor(minNumber + Math.random() * maxNumber).toString();
        } while (this.gameRooms.has(code));
        return code;
    }
}
