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
        });
    }

    sendMessage(message: string, senderPlayer: IPlayer): void {
        const chatMessage = this.packageMessage(message, senderPlayer);
        this.chatHistory.update((history) => [...history, chatMessage]);
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

    clearChatHistory(): void {
        this.chatHistory.set([]);
    }
}
