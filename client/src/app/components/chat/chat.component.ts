import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '@app/services/chat/chat.service';
import { PlayerService } from '@app/services/player/player.service';
import { IPlayer } from '@common/player';

@Component({
    selector: 'app-chat',
    imports: [FormsModule],
    templateUrl: './chat.component.html',
    styleUrl: './chat.component.scss',
})
export class ChatComponent {
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

    sendMessage(): void {
        const trimmedMessage = this.newMessage.trim();
        if (trimmedMessage && this.myPlayer) {
            this.chatService.sendMessage(trimmedMessage, this.myPlayer);
            this.newMessage = '';
        }
    }
}
