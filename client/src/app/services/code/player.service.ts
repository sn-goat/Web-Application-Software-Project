import { Injectable } from '@angular/core';
import { Player } from '@common/player';
import { BehaviorSubject, Observable } from 'rxjs';
import { MAX_PLAYERS } from '@app/constants/playerConst';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    activePlayer$: Observable<string>;
    admin$: Observable<string>;
    players$: Observable<Player[]>;

    // This is a mock player for testing purposes
    mockPlayer: Player = {
        id: '1',
        username: 'mockPlayer',
        avatar: '6',
        life: 100,
        attack: 10,
        defense: 10,
        rapidity: 5,
        attackDice: 'd6',
        defenseDice: 'd4',
        movementPts: 5,
        actions: 2,
    };

    mockPlayer0: Player = {
        id: '1',
        username: 'mockPlayer0',
        avatar: '6',
        life: 100,
        attack: 10,
        defense: 10,
        rapidity: 2,
        attackDice: 'd6',
        defenseDice: 'd4',
        movementPts: 5,
        actions: 2,
    };

    mockPlayer1: Player = {
        id: '1',
        username: 'mockPlayer1',
        avatar: '6',
        life: 100,
        attack: 10,
        defense: 10,
        rapidity: 10,
        attackDice: 'd6',
        defenseDice: 'd4',
        movementPts: 5,
        actions: 2,
    };

    private playerUsername: string = this.mockPlayer.username;
    private activePlayer = new BehaviorSubject<string>(this.mockPlayer.username);
    private admin = new BehaviorSubject<string>(this.mockPlayer.username);
    private players = new BehaviorSubject<Player[]>([this.mockPlayer, this.mockPlayer0, this.mockPlayer1]);

    constructor() {
        this.activePlayer$ = this.activePlayer.asObservable();
        this.players$ = this.players.asObservable();
        this.admin$ = this.admin.asObservable();
    }

    setActivePlayer(username: string): void {
        this.activePlayer.next(username);
    }

    setPlayers(players: Player[]): void {
        if (players.length <= MAX_PLAYERS) {
            this.players.next(players);
            this.sortPlayers();
        }
    }

    sortPlayers(): void {
        const sortedPlayers = this.players.value.sort((a, b) => a.rapidity - b.rapidity).reverse();
        this.players.next(sortedPlayers);
    }

    getPlayer(username: string): Player | undefined {
        if (!username) {
            return undefined;
        }
        return this.players.value.find((player) => player.username === username);
    }

    editPlayer(player: Player): void {
        const players: Player[] = this.players.value;
        const playerToUpdate = this.getPlayer(player.username);
        if (!player || !playerToUpdate || playerToUpdate.username !== this.playerUsername) {
            return;
        }

        const index = players.indexOf(playerToUpdate);
        players[index] = player;

        this.players.next(players);
    }

    removePlayerByName(username: string): boolean {
        const player = this.getPlayer(username);
        if (player) {
            this.removePlayer(player);
            return true;
        }
        return false;
    }

    setPlayerUsername(username: string): void {
        this.playerUsername = username;
    }

    getPlayerUsername(): string {
        return this.playerUsername;
    }

    setAdmin(username: string): void {
        this.admin.next(username);
    }

    addPlayer(player: Player): void {
        const players = this.players.value;
        const playerExists = players.find((p) => p.username === player.username);
        if (!player || !playerExists || players.length >= MAX_PLAYERS) {
            return;
        }
        players.push(player);
        this.players.next(players);
    }

    removePlayer(player: Player): void {
        const players = this.players.value;
        const playerExists = players.find((p) => p.username === player.username);
        if (!player || !playerExists || !players.length) {
            return;
        }
        players.splice(players.indexOf(player), 1);
        this.players.next(players);
    }

    removeAllPlayers(): void {
        this.players.next([]);
    }
}
