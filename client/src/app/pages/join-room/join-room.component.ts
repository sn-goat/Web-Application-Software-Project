import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketService } from '@app/services/code/socket.service';

@Component({
  selector: 'app-join-room',
  templateUrl: './join-room.component.html',
  styleUrls: ['./join-room.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class JoinRoomComponent {
  accessCode: string = '';
  playerName: string = '';
  joinResult: string = '';

  constructor(private socketService: SocketService) {}

  joinRoom() {
    const player = { id: this.generateId(), name: this.playerName, avatar: 'default' };
    this.socketService.joinGame(this.accessCode, player);
    this.socketService.onPlayerJoined().subscribe((data: any) => {
      this.joinResult = `Joined room ${this.accessCode} as ${player.name}`;
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}
