import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderBarComponent } from '@app/components/common/header-bar/header-bar.component';
import { FormCharacterComponent } from '@app/components/form-character/form-character.component';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { ACCESS_CODE_REGEX } from '@common/game';

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
    isValidCode: boolean = false;
    private readonly socketReceiver: SocketReceiverService = inject(SocketReceiverService);
    private readonly socketEmitter: SocketEmitterService = inject(SocketEmitterService);

    validateCode(): void {
        this.isValidCode = ACCESS_CODE_REGEX.test(this.accessCode);
    }

    joinRoom() {
        if (!this.isValidCode) return;

        this.socketEmitter.joinRoom();

        this.socketReceiver.onPlayerJoined().subscribe(() => {
            this.joinResult = `Salle ${this.accessCode} rejointe`;
            this.showCharacterForm = true;
        });

        this.socketReceiver.onJoinError().subscribe((message) => {
            this.joinResult = message;
            this.showCharacterForm = false;
        });
    }

    closeCharacterForm(): void {
        this.showCharacterForm = false;
    }
}
