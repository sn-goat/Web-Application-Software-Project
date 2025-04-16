import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SubLifecycleHandlerComponent } from '@app/components/common/sub-lifecycle-handler/subscription-lifecycle-handler.component';
import { ChatService } from '@app/services/chat/chat.service';
import { PlayerService } from '@app/services/player/player.service';
import { PopupService } from '@app/services/popup/popup.service';
import { IPlayer } from '@common/player';

@Component({
    selector: 'app-chat',
    imports: [FormsModule],
    templateUrl: './chat.component.html',
    styleUrl: './chat.component.scss',
})
export class ChatComponent extends SubLifecycleHandlerComponent implements AfterViewChecked, OnInit {
    @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
    @ViewChild('chatHistory') chatHistory!: ElementRef;
    @ViewChild('messageInput') messageInput!: ElementRef;

    newMessage: string = '';
    myPlayer: IPlayer | null = null;
    readonly chatService = inject(ChatService);
    private previousMessageCount: number = 0;
    private readonly popupService = inject(PopupService);
    private readonly playerService = inject(PlayerService);

    ngOnInit() {
        this.autoSubscribe(this.playerService.myPlayer, (player) => {
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

    onInputFocus(): void {
        this.popupService.setChatInputFocused(true);
    }

    onInputBlur(): void {
        this.popupService.setChatInputFocused(false);
    }
}
