import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormCharacterComponent } from '@app/components/form-character/form-character.component';
import { SocketService } from '@app/services/code/socket.service';

@Component({
    selector: 'app-join-room',
    templateUrl: './join-room.component.html',
    styleUrls: ['./join-room.component.scss'],
    imports: [CommonModule, FormsModule, FormCharacterComponent],
})
export class JoinRoomComponent {
    @Input() accessCode: string = '';
    joinResult: string = '';
    showCharacterForm: boolean = false;

    constructor(private socketService: SocketService) {}

    joinRoom() {
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
