import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketService } from '@app/services/code/socket.service';

@Component({
  selector: 'app-organizer-waiting-page',
  templateUrl: './organizer-waiting-page.component.html',
  styleUrls: ['./organizer-waiting-page.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class OrganizerWaitingPageComponent implements OnInit {
  accessCode: string = '';

  constructor(private socketService: SocketService) {}

  ngOnInit() {
    this.socketService.onGameCreated().subscribe((data: any) => {
      this.accessCode = data.accessCode;
    });
    this.socketService.createGame('organizer-1');
  }
}
