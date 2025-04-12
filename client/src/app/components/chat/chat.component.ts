import { FormsModule } from '@angular/forms';
import { ChatService } from '@app/services/chat/chat.service';
import { PlayerService } from '@app/services/player/player.service';
import { IPlayer } from '@common/player';
import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';

@Component({
    selector: 'app-chat',
    imports: [FormsModule],
    templateUrl: './chat.component.html',
    styleUrl: './chat.component.scss',
})
export class ChatComponent implements AfterViewChecked {
    @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
    @ViewChild('chatHistory') chatHistory!: ElementRef;

    newMessage: string = '';
    myPlayer: IPlayer | null = null;
    private previousMessageCount: number = 0;

    constructor(
        private readonly playerService: PlayerService,
        readonly chatService: ChatService,
    ) {
        this.playerService.myPlayer.subscribe((player) => {
            this.myPlayer = player;
        });
    }

    ngAfterViewChecked(): void {
        const currentMessages = this.chatService.chatHistory();
        if (currentMessages.length > this.previousMessageCount) {
            this.scrollToBottom();
            this.previousMessageCount = currentMessages.length;
        }
    }

    scrollToBottom(): void {
        if (this.scrollAnchor) {
            this.scrollAnchor.nativeElement.scrollIntoView({ behavior: 'smooth' });
        }
    }

    sendMessage(): void {
        const trimmedMessage = this.newMessage.trim();
        if (trimmedMessage && this.myPlayer) {
            this.chatService.sendMessage(trimmedMessage, this.myPlayer);
            this.newMessage = '';
        }
    }
}
