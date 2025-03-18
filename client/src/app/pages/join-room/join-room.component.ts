import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderBarComponent } from '@app/components/common/header-bar/header-bar.component';
import { FormCharacterComponent } from '@app/components/form-character/form-character.component';
import { SocketService } from '@app/services/code/socket.service';
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
    private readonly socketService: SocketService = inject(SocketService);

    validateCode(): void {
        this.isValidCode = ACCESS_CODE_REGEX.test(this.accessCode);
    }

    joinRoom() {
        if (!this.isValidCode) return;

        this.socketService.joinRoom(this.accessCode);

        this.socketService.onPlayerJoined().subscribe(() => {
            this.joinResult = `Salle ${this.accessCode} rejointe`;
            this.showCharacterForm = true;
        });

        this.socketService.onJoinError().subscribe((data: { message: string }) => {
            this.joinResult = data.message;
            this.showCharacterForm = false;
        });
    }

    closeCharacterForm(): void {
        this.showCharacterForm = false;
    }
}
