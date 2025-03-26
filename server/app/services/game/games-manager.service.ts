import { Room } from '@app/class/room';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Player } from '@app/class/player';
import { Cell } from '@common/board';
import { Game } from '@app/class/game';
import { Fight } from '@app/class/fight';

const minNumber = 1000;
const maxNumber = 9000;

@Injectable()
export class GameManagerService {
    private readonly logger = new Logger(GameManagerService.name);
    private gameRooms: Map<string, Room> = new Map();

    constructor(private readonly globalEmitter: EventEmitter2) {}

    createRoom(organizerId: string, map: Cell[][]): Room {
        const accessCode = this.generateUniqueAccessCode();
        const room: Room = new Room(this.globalEmitter, accessCode, organizerId, map);
        this.gameRooms.set(accessCode, room);
        this.logger.log(`Room created with access code: ${accessCode} by organizer: ${organizerId}`);
        return room;
    }

    joinRoom(accessCode: string): Room | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found.`);
            return null;
        }
        if (room.isLocked) {
            this.logger.error(`Room with access code ${accessCode} is locked.`);
            return null;
        }
        this.logger.log(`PlayerStats joined room ${accessCode}`);
        return room;
    }

    removePlayer(accessCode: string, playerId: string): Room | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found for player removal.`);
            return null;
        }
        room.game.removePlayer(playerId);
        this.logger.log(`PlayerStats ${playerId} removed from room ${accessCode}`);
        return room;
    }

    disconnectPlayer(accessCode: string, playerId: string): Room | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found for player disconnection.`);
            return null;
        }
        if (room.isPlayerAdmin(playerId)) {
            if (room.game.hasStarted) {
                room.game.isDebugMode = false;
                this.removePlayer(accessCode, playerId);
            } else {
                for (let i = room.game.players.length - 1; i >= 0; i--) {
                    const player = room.game.players[i];
                    this.removePlayer(accessCode, player.id);
                    this.logger.log(`PlayerStats ${player.id} disconnected from room ${accessCode}.`);
                }
                this.deleteRoom(accessCode);
                this.logger.log(`Room ${accessCode} deleted.`);
            }
        } else {
            this.removePlayer(accessCode, playerId);
            this.logger.log(`PlayerStats ${playerId} disconnected from room ${accessCode}.`);
        }
        return room;
    }

    quitGame(accessCode: string, playerId: string): string {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found for quitting game.`);
            return;
        }
        this.logger.log(`PlayerStats ${playerId} quit game in room ${accessCode}.`);
        this.removePlayer(accessCode, playerId);

        if (room.game.players.length === 1) {
            const lastPlayerId = room.game.players[0].id;
            this.logger.log(`LastPlayer ${room.game.players[0].name} quit game in room ${accessCode}.`);
            this.removePlayer(accessCode, room.game.players[0].id);
            this.deleteRoom(accessCode);
            return lastPlayerId;
        }
        return;
    }

    lockRoom(accessCode: string): Room | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found for locking.`);
            return null;
        }
        room.setLock(true);
        this.logger.log(`Room ${accessCode} is now locked.`);
        return room;
    }

    unlockRoom(accessCode: string): Room | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found for unlocking.`);
            return null;
        }
        room.setLock(false);
        this.logger.log(`Room ${accessCode} is now unlocked.`);
        return room;
    }

    getRoom(accessCode: string): Room | null {
        return this.gameRooms.get(accessCode) || null;
    }

    getGame(accessCode: string): Game | null {
        return this.gameRooms.get(accessCode)?.game || null;
    }

    getFight(accessCode: string): Fight | null {
        return this.gameRooms.get(accessCode)?.game.fight || null;
    }

    shareCharacter(accessCode: string, player: Player): Room | null {
        const room = this.gameRooms.get(accessCode);
        if (!room) {
            this.logger.error(`Room with access code ${accessCode} not found.`);
            return null;
        }

        const existingNames = room.game.players.map((p) => p.name);
        const baseName = player.name;
        let nameToAssign = baseName;
        let suffix = 1;

        while (existingNames.includes(nameToAssign)) {
            suffix++;
            nameToAssign = `${baseName}-${suffix}`;
        }

        player.name = nameToAssign;
        room.game.addPlayer(player);
        this.logger.log(`PlayerStats ${player.id} joined room ${accessCode} with name ${player.name}`);

        if (room.game.isGameFull()) {
            room.isLocked = true;
            this.logger.log(`Room ${accessCode} is now locked (max players reached).`);
        }

        return room;
    }

    deleteRoom(accessCode: string): void {
        if (this.gameRooms.has(accessCode)) {
            this.gameRooms.delete(accessCode);
            this.logger.log(`Room with access code ${accessCode} has been deleted.`);
            this.globalEmitter.emit('room.deleted', accessCode);
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
