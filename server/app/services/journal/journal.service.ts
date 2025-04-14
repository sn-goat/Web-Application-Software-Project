// import { IRoom } from '@common/game';
// import { JournalEvent } from '@common/game.gateway.events';
// import { Entry, FightJournal, FightMessage, GameMessage } from '@common/journal';
// import { Injectable, Logger } from '@nestjs/common';
// import { Server } from 'socket.io';

// @Injectable()
// export class JournalService {
//     journalMap: Map<string, Entry[]> = new Map();
//     private logger: Logger = new Logger(JournalService.name);

//     dispatchEntry(roomFight: IRoom | FightJournal, currentPlayers: string[], messageType: GameMessage | FightMessage, server: Server): Entry | null {
//         let message: Entry;

//         if (Object.values(GameMessage).includes(messageType as GameMessage)) {
//             message = this.processGameEntry(roomFight as IRoom, messageType as GameMessage, currentPlayers);
//             if (!message) {
//                 this.logger.error('Failed to process game entry');
//                 return null;
//             }
//             server.to(message.accessCode).emit(JournalEvent.Add, message);
//         } else if (Object.values(FightMessage).includes(messageType as FightMessage)) {
//             message = this.processFightEntry(roomFight as FightJournal, messageType as FightMessage, currentPlayers);
//             if (!message) {
//                 this.logger.error('Failed to process game entry');
//                 return null;
//             }
//             message.playersInvolved.forEach((playerId: string) => {
//                 server.to(playerId).emit(JournalEvent.Add, message);
//             });
//         }
//         this.recordEntry(message);

//         this.logger.log('Journal Entry dispatched: ' + message.message);

//         return message;
//     }

//     private processGameEntry(room: IRoom, messageType: GameMessage, currentPlayers: string[]): Entry {
//         if (!room.game.players || !currentPlayers) {
//             this.logger.error('Player space or trigger player is undefined or null');
//             return null;
//         }

//         const currDate = new Date().toTimeString().split(' ')[0];
//         let messageFormat: string;

//         if (currentPlayers.length === 2) {
//             messageFormat = '[' + currDate + ']: ' + messageType + ' ' + currentPlayers.join(' et ');
//         } else if (currentPlayers.length === 1) {
//             if (messageType === GameMessage.EndGame) {
//                 messageFormat =
//                     '[' +
//                     currDate +
//                     ']: ' +
//                     messageType +
//                     ' ' +
//                     currentPlayers[0] +
//                     '\n' +
//                     'Les joueurs actifs sont ' +
//                     room.game.players.map((player) => player.name).join(', ');
//             } else {
//                 messageFormat = '[' + currDate + ']: ' + messageType + ' ' + currentPlayers[0];
//             }
//         } else {
//             this.logger.error('Too many players involved in the message');
//             return null;
//         }

//         const newMessage: Entry = {
//             messageType,
//             message: messageFormat,
//             accessCode: room.accessCode,
//             playersInvolved: [messageType === GameMessage.Quit ? '' : room.game.players.find((player) => player.name === currentPlayers[0]).id],
//         };

//         return newMessage;
//     }

//     private processFightEntry(fight: FightJournal, messageType: FightMessage, currentPlayers: string[]): Entry {
//         if (!fight.attacker || !fight.defender || !currentPlayers) {
//             this.logger.error('Player space or trigger player is undefined or null');
//             return null;
//         }

//         const currDate = new Date().toTimeString().split(' ')[0];
//         let messageFormat: string;

//         if (messageType === FightMessage.Attack) {
//             messageFormat =
//                 '[' +
//                 currDate +
//                 ']: ' +
//                 messageType +
//                 `${fight.attacker.name}
//                 avec une valeur dé d'atttaque de
//                 ${fight.attacker.diceResult} |
//                 ${fight.defender.name} se défend avec une valeur dé défense de ${fight.defender.diceResult} |
//                 ${fight.attacker.name} inflige ${fight.damage} points de dégâts à ${fight.defender.name}`;
//         } else {
//             messageFormat = '[' + currDate + ']: ' + messageType + ' ' + currentPlayers[0];
//         }

//         const newMessage: Entry = {
//             messageType,
//             message: messageFormat,
//             accessCode: fight.accessCode,
//             playersInvolved: [fight.attacker.id, fight.defender.id],
//         };

//         return newMessage;
//     }

//     private recordEntry(entry: Entry): void {
//         const accessCode = entry.accessCode;

//         if (this.journalMap.has(accessCode)) {
//             this.journalMap.get(accessCode).push(entry);
//         } else {
//             this.journalMap.set(accessCode, [entry]);
//         }
//     }
// }
