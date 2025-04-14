import { AfterViewChecked, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '@app/services/chat/chat.service';
import { PlayerService } from '@app/services/player/player.service';
import { PopupService } from '@app/services/popup/popup.service';
import { IPlayer } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-chat',
    imports: [FormsModule],
    templateUrl: './chat.component.html',
    styleUrl: './chat.component.scss',
})
export class ChatComponent implements AfterViewChecked, OnDestroy {
    @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
    @ViewChild('chatHistory') chatHistory!: ElementRef;
    @ViewChild('messageInput') messageInput!: ElementRef;

    newMessage: string = '';
    myPlayer: IPlayer | null = null;
    readonly chatService = inject(ChatService);
    private previousMessageCount: number = 0;
    private subscriptions: Subscription[] = [];
    private readonly popupService = inject(PopupService);
    private readonly playerService = inject(PlayerService);

    constructor() {
        this.subscriptions.push(
            this.playerService.myPlayer.subscribe((player) => {
                this.myPlayer = player;
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((s) => s.unsubscribe());
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

    onInputFocus(): void {
        this.popupService.setChatInputFocused(true);
    }

    onInputBlur(): void {
        this.popupService.setChatInputFocused(false);
    }
}
