import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { diceToImageLink } from '@app/constants/playerConst';
import { GameService } from '@app/services/code/game.service';
import { SocketService } from '@app/services/code/socket.service';
import { Game, Room } from '@common/game';
import { getLobbyLimit } from '@common/lobby-limits';
import { PlayerStats } from '@common/player';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-lobby',
    templateUrl: './lobby.component.html',
    styleUrls: ['./lobby.component.scss'],
    imports: [CommonModule, FormsModule],
})
export class LobbyComponent implements OnInit {
    accessCode: string = '';
    players: PlayerStats[] = [];
    isRoomLocked: boolean = false;
    isAdmin: boolean = false;
    maxPlayers: number = 0;
    diceToImageLink = diceToImageLink;

    constructor(
        private socketService: SocketService,
        private router: Router,
        private gameService: GameService,
    ) {}

    ngOnInit() {
        const gameSize = this.socketService.getGameSize();
        this.maxPlayers = getLobbyLimit(gameSize);

        if (history.state && history.state.accessCode) {
            this.accessCode = history.state.accessCode;
        }

        this.socketService
            .onPlayerJoined()
            .pipe(map((response: { room: Room } | Room) => ('room' in response ? response.room : response)))
            .subscribe((room: Room) => {
                this.players = room.players;
                this.accessCode = room.accessCode;
                this.checkIfAdmin();
            });

        this.socketService.onPlayersList().subscribe((players: PlayerStats[]) => {
            this.players = players;
            if (this.players.length === this.maxPlayers && !this.isRoomLocked) {
                this.socketService.lockRoom(this.accessCode);
                this.isRoomLocked = true;
            } else if (this.players.length < this.maxPlayers && this.isRoomLocked) {
                this.socketService.unlockRoom(this.accessCode);
                this.isRoomLocked = false;
            }
        });

        this.socketService.onRoomLocked().subscribe(() => {
            this.isRoomLocked = true;
        });

        this.socketService.onPlayerRemoved().subscribe((players: PlayerStats[]) => {
            this.players = players;
            if (!players.find((p) => p.id === this.socketService.getCurrentPlayerId())) {
                if (!this.isAdmin) {
                    confirm("Vous avez été retiré de la partie par l'admin, vous allez être redirigé vers la page d'accueil");
                }

                this.router.navigate(['/home']);
            }
        });

        this.socketService.onPlayerDisconnected().subscribe((players: PlayerStats[]) => {
            this.players = players;
            if (!players.find((p) => p.id === this.socketService.gameRoom.organizerId)) {
                if (!this.isAdmin) {
                    confirm("Deconnexion de la partie. Vous allez être redirigé vers la page d'accueil");
                }
            }

            this.router.navigate(['/home']);
        });

        this.socketService.onAdminDisconnected().subscribe(() => {
            confirm("L'admin s'est déconnecté. Vous allez être redirigé vers la page d'accueil");
            this.disconnect();
        });

        this.socketService.onBroadcastStartGame().subscribe((game: Game) => {
            this.gameService.setGame(game);
            this.router.navigate(['/game']);
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

    configureGame() {
        this.socketService.configureGame(this.accessCode, this.players);
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
