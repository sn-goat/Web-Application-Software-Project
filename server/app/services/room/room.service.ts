// import { Room } from '@common/game';
// import { getLobbyLimit } from '@common/lobby-limits';
// import { PlayerStats } from '@common/player';
// import { Injectable, Logger } from '@nestjs/common';
// import { EventEmitter2 } from '@nestjs/event-emitter';
// import { GameService } from '@app/services/game/game.service';

// const minNumber = 1000;
// const maxNumber = 9000;

// @Injectable()
// export class RoomService {
//     private readonly logger = new Logger(RoomService.name);
//     private gameRooms: Map<string, Room> = new Map();

//     constructor(
//         private readonly eventEmitter: EventEmitter2,
//         private readonly gameService: GameService,
//     ) {}

//     createRoom(organizerId: string, size: number): Room {
//         const accessCode = this.generateUniqueAccessCode();
//         const newRoom: Room = {
//             accessCode,
//             organizerId,
//             players: [],
//             isLocked: false,
//             mapSize: size,
//         };
//         this.gameRooms.set(accessCode, newRoom);
//         this.logger.log(`Room created with access code: ${accessCode} by organizer: ${organizerId}`);
//         return newRoom;
//     }

//     joinRoom(accessCode: string): Room | null {
//         const room = this.gameRooms.get(accessCode);
//         if (!room) {
//             this.logger.error(`Room with access code ${accessCode} not found.`);
//             return null;
//         }
//         if (room.isLocked) {
//             this.logger.error(`Room with access code ${accessCode} is locked.`);
//             return null;
//         }
//         this.logger.log(`PlayerStats joined room ${accessCode}`);
//         return room;
//     }

//     removePlayer(accessCode: string, playerId: string): Room | null {
//         const room = this.gameRooms.get(accessCode);
//         if (!room) {
//             this.logger.error(`Room with access code ${accessCode} not found for player removal.`);
//             return null;
//         }
//         const index = room.players.findIndex((p) => p.id === playerId);
//         if (index < 0) {
//             this.logger.error(`PlayerStats ${playerId} not found in room ${accessCode}`);
//             return null;
//         }
//         room.players.splice(index, 1);
//         this.logger.log(`PlayerStats ${playerId} removed from room ${accessCode}`);
//         return room;
//     }

//     disconnectPlayer(accessCode: string, playerId: string): Room | null {
//         const room = this.gameRooms.get(accessCode);
//         if (!room) {
//             this.logger.error(`Room with access code ${accessCode} not found for player disconnection.`);
//             return null;
//         }
//         if (room.organizerId === playerId) {
//             for (let i = room.players.length - 1; i >= 0; i--) {
//                 const player = room.players[i];
//                 this.removePlayer(accessCode, player.id);
//                 this.logger.log(`PlayerStats ${player.id} disconnected from room ${accessCode}.`);
//             }
//             this.deleteRoom(accessCode);
//             this.logger.log(`Room ${accessCode} deleted.`);
//         } else {
//             this.logger.log(`organizerId: ${room.organizerId}, playerId: ${playerId}`);
//             this.removePlayer(accessCode, playerId);
//             this.logger.log(`PlayerStats ${playerId} disconnected from room ${accessCode}.`);
//         }
//         return room;
//     }

//     quitGame(accessCode: string, playerId: string): string {
//         const room = this.gameRooms.get(accessCode);
//         if (!room) {
//             this.logger.error(`Room with access code ${accessCode} not found for quitting game.`);
//             return;
//         }
//         this.logger.log(`PlayerStats ${playerId} quit game in room ${accessCode}.`);
//         this.gameService.removePlayer(accessCode, playerId);
//         this.removePlayer(accessCode, playerId);

//         if (room.players.length === 1) {
//             const lastPlayerId = room.players[0].id;
//             this.logger.log(`LastPlayer ${room.players[0].name} quit game in room ${accessCode}.`);
//             this.removePlayer(accessCode, room.players[0].id);
//             this.gameService.deleteGame(accessCode);
//             this.deleteRoom(accessCode);
//             return lastPlayerId;
//         }
//         return;
//     }

//     lockRoom(accessCode: string): Room | null {
//         const room = this.gameRooms.get(accessCode);
//         if (!room) {
//             this.logger.error(`Room with access code ${accessCode} not found for locking.`);
//             return null;
//         }
//         room.isLocked = true;
//         this.logger.log(`Room ${accessCode} is now locked.`);
//         return room;
//     }

//     unlockRoom(accessCode: string): Room | null {
//         const room = this.gameRooms.get(accessCode);
//         if (!room) {
//             this.logger.error(`Room with access code ${accessCode} not found for unlocking.`);
//             return null;
//         }
//         room.isLocked = false;
//         this.logger.log(`Room ${accessCode} is now unlocked.`);
//         return room;
//     }

//     getRoom(accessCode: string): Room | null {
//         return this.gameRooms.get(accessCode) || null;
//     }

//     shareCharacter(accessCode: string, player: PlayerStats): Room | null {
//         const room = this.gameRooms.get(accessCode);
//         if (!room) {
//             this.logger.error(`Room with access code ${accessCode} not found.`);
//             return null;
//         }

//         const existingNames = room.players.map((p) => p.name);
//         const baseName = player.name;
//         let nameToAssign = baseName;
//         let suffix = 1;

//         while (existingNames.includes(nameToAssign)) {
//             suffix++;
//             nameToAssign = `${baseName}-${suffix}`;
//         }

//         player.name = nameToAssign;
//         room.players.push(player);
//         this.logger.log(`PlayerStats ${player.id} joined room ${accessCode} with name ${player.name}`);

//         const maxPlayers = getLobbyLimit(room.mapSize);
//         this.logger.log(`Room ${accessCode} has ${room.players.length} players. Max players allowed: ${maxPlayers}`);

//         if (maxPlayers && room.players.length >= maxPlayers) {
//             room.isLocked = true;
//             this.logger.log(`Room ${accessCode} is now locked (max players reached).`);
//         }

//         return room;
//     }

//     deleteRoom(accessCode: string): void {
//         if (this.gameRooms.has(accessCode)) {
//             this.gameRooms.delete(accessCode);
//             this.logger.log(`Room with access code ${accessCode} has been deleted.`);
//             this.eventEmitter.emit('room.deleted', accessCode);
//         } else {
//             this.logger.error(`Room with access code ${accessCode} not found for deletion.`);
//         }
//     }

//     private generateUniqueAccessCode(): string {
//         let code: string;
//         do {
//             code = Math.floor(minNumber + Math.random() * maxNumber).toString();
//         } while (this.gameRooms.has(code));
//         return code;
//     }
// }
