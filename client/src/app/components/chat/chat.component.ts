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

    newMessage: string = '';
    myPlayer: IPlayer | null = null;

    constructor(
        private readonly playerService: PlayerService,
        readonly chatService: ChatService,
    ) {
        this.playerService.myPlayer.subscribe((player) => {
            this.myPlayer = player;
        });
    }

    ngAfterViewChecked(): void {
        this.scrollToBottom();
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
