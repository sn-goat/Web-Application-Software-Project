/* eslint-disable no-console */
import { Injectable, signal } from '@angular/core';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { ChatMessage } from '@common/chat';
import { IPlayer } from '@common/player';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    chatHistory = signal<ChatMessage[]>([]);

    constructor(
        private readonly socketEmitterService: SocketEmitterService,
        private readonly socketReceiverService: SocketReceiverService,
    ) {
        this.socketReceiverService.receiveMessageFromServer().subscribe((message) => {
            this.chatHistory.update((history) => [...history, message]);
            console.log('Chat message received:', message);
            console.log('Chat history post receive:', this.chatHistory());
        });
    }

    sendMessage(message: string, senderPlayer: IPlayer): void {
        const chatMessage = this.packageMessage(message, senderPlayer);
        this.chatHistory.update((history) => [...history, chatMessage]);
        console.log('Chat message sent:', chatMessage);
        console.log('Chat history post send:', this.chatHistory());
        this.socketEmitterService.sendMessageToServer(chatMessage);
    }

    packageMessage(message: string, senderPlayer: IPlayer): ChatMessage {
        return {
            accessCode: this.socketEmitterService.getAccessCode(),
            sender: senderPlayer,
            message,
            timestamp: new Date().toLocaleTimeString(undefined, { hour12: false }),
        };
    }
}
