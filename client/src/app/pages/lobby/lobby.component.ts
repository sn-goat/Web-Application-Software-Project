import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/code/socket.service';
import { getLobbyLimit } from '@common/lobby-limits';
import { Player } from '@common/player';

@Component({
    selector: 'app-lobby',
    templateUrl: './lobby.component.html',
    styleUrls: ['./lobby.component.scss'],
    imports: [CommonModule, FormsModule],
})
export class LobbyComponent implements OnInit {
    accessCode: string = '';
    players: Player[] = [];
    isRoomLocked: boolean = false;
    isAdmin: boolean = false;
    maxPlayers: number = 0;

    constructor(
        private socketService: SocketService,
        private router: Router,
    ) {}

    ngOnInit() {
        const gameSize = this.socketService.getGameSize();
        this.maxPlayers = getLobbyLimit(gameSize);

        if (history.state && history.state.accessCode) {
            this.accessCode = history.state.accessCode;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.socketService.onPlayerJoined().subscribe((data: any) => {
            this.players = data.room.players;
            this.accessCode = data.room.accessCode;
            this.checkIfAdmin();
        });

        this.socketService.onPlayersList().subscribe((players: Player[]) => {
            this.players = players;
            this.checkIfAdmin();
            if (this.players.length === this.maxPlayers && !this.isRoomLocked) {
                this.socketService.lockRoom(this.accessCode);
                this.isRoomLocked = true;
            }
        });

        this.socketService.onRoomLocked().subscribe(() => {
            this.isRoomLocked = true;
        });

        this.socketService.onPlayerRemoved().subscribe((players: Player[]) => {
            this.players = players;
            if (!players.find((p) => p.id === this.socketService.getCurrentPlayerId())) {
                if (!this.isAdmin) {
                    confirm("Vous avez été retiré de la partie par l'admin, vous allez être redirigé vers la page d'accueil");
                }
                this.router.navigate(['/home']);
            }
        });

        this.socketService.onPlayerDisconnected().subscribe((players: Player[]) => {
            // Mise à jour de la liste des joueurs
            this.players = players;
            if (!players.find((p) => p.id === this.socketService.getCurrentPlayerId())) {
                if (!this.isAdmin) {
                    confirm("Deconnexion de la partie. Vous allez être redirigé vers la page d'accueil");
                }
                this.router.navigate(['/home']);
            }
        });
    }

    checkIfAdmin() {
        this.isAdmin = this.players.length > 0 && this.players[0].id === this.socketService.getCurrentPlayerId();
    }

    toggleRoomLock() {
        if (this.players.length >= this.maxPlayers) {
            return;
        }
        if (this.isRoomLocked) {
            this.socketService.unlockRoom(this.accessCode);
            this.isRoomLocked = false;
        } else {
            this.socketService.lockRoom(this.accessCode);
            this.isRoomLocked = true;
        }
    }

    removePlayer(playerId: string) {
        this.socketService.removePlayer(this.accessCode, playerId);
    }

    disconnect() {
        this.socketService.disconnect(this.accessCode, this.socketService.getCurrentPlayerId());
        this.router.navigate(['/home']).then(() => window.location.reload());
    }

    disconnectWithoutReload() {
        this.socketService.disconnect(this.accessCode, this.socketService.getCurrentPlayerId());
        this.router.navigate(['/home']);
    }

    getCurrentPlayerId(): string {
        return this.socketService.getCurrentPlayerId();
    }
}
