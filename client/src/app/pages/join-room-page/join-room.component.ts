import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderBarComponent } from '@app/components/common/header-bar/header-bar.component';
import { FormCharacterComponent } from '@app/components/form-character/form-character.component';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { ACCESS_CODE_REGEX, CODE_LENGTH_RESET_THRESHOLD } from '@common/game';

@Component({
    selector: 'app-join-room',
    templateUrl: './join-room.component.html',
    styleUrls: ['./join-room.component.scss'],
    imports: [CommonModule, FormsModule, FormCharacterComponent, HeaderBarComponent],
})
export class JoinRoomComponent {
    @Input() accessCode: string = '';
    joinResult: string = '';
    showCharacterForm: boolean = false;
    characterFormOpened: boolean = false;
    isValidCode: boolean = false;
    private readonly socketReceiver: SocketReceiverService = inject(SocketReceiverService);
    private readonly socketEmitter: SocketEmitterService = inject(SocketEmitterService);

    validateCode(): void {
        this.isValidCode = ACCESS_CODE_REGEX.test(this.accessCode);
        if (this.accessCode.length === CODE_LENGTH_RESET_THRESHOLD) {
            this.joinResult = '';
        }
    }
    joinRoom() {
        if (!this.isValidCode) return;

        this.socketEmitter.joinRoom(this.accessCode);

        this.socketReceiver.onPlayerJoined().subscribe(() => {
            this.joinResult = `Salle ${this.accessCode} rejointe`;
            this.showCharacterForm = true;
        });

        this.socketReceiver.onJoinError().subscribe((message: string) => {
            this.joinResult = message;
            this.showCharacterForm = false;
        });
    }

    onEnterKey(): void {
        this.validateCode();
        if (this.isValidCode) {
            this.joinRoom();
        }
    }

    closeCharacterForm(): void {
        this.characterFormOpened = true;
        this.showCharacterForm = false;
    }
}
