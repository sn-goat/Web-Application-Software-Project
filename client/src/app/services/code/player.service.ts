import { Injectable } from '@angular/core';
import { MAX_PLAYERS } from '@app/constants/playerConst';
import { Player } from '@common/player';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    activePlayer$: Observable<string>;
    admin$: Observable<string>;
    players$: Observable<Player[]>;

    // // This is a mock player for testing purposes
    // mockPlayer: Player = {
    //     id: '1',
    //     username: 'mockPlayer',
    //     avatar: '6',
    //     life: 100,
    //     attack: 10,
    //     defense: 10,
    //     rapidity: 5,
    //     attackDice: 'd6',
    //     defenseDice: 'd4',
    //     movementPts: 5,
    //     actions: 2,
    // };

    // mockPlayer0: Player = {
    //     id: '1',
    //     username: 'mockPlayer0',
    //     avatar: '4',
    //     life: 100,
    //     attack: 10,
    //     defense: 10,
    //     rapidity: 2,
    //     attackDice: 'd6',
    //     defenseDice: 'd4',
    //     movementPts: 5,
    //     actions: 2,
    // };

    // mockPlayer1: Player = {
    //     id: '1',
    //     username: 'mockPlayer1',
    //     avatar: '2',
    //     life: 100,
    //     attack: 10,
    //     defense: 10,
    //     rapidity: 10,
    //     attackDice: 'd6',
    //     defenseDice: 'd4',
    //     movementPts: 5,
    //     actions: 2,
    // };

    private playerUsername: string;
    private activePlayer = new BehaviorSubject<string>('');
    private admin = new BehaviorSubject<string>('');
    private players = new BehaviorSubject<Player[]>([]);

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
        if (!player) return; // First check if player exists

        const players: Player[] = this.players.value;
        const playerToUpdate = this.getPlayer(player.username);
        if (!playerToUpdate || playerToUpdate.username !== this.playerUsername) {
            return;
        }

        const index = players.findIndex((p) => p.username === player.username);
        if (index >= 0) {
            players[index] = player;
            this.players.next(players);
        }
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
        if (!player) return; // Handle undefined player

        const players = this.players.value;
        const playerExists = players.find((p) => p.username === player.username);
        if (!playerExists || players.length >= MAX_PLAYERS) {
            return;
        }
        players.push(player);
        this.players.next([...players]); // Create new array to ensure state change detection
    }

    removePlayer(player: Player): void {
        if (!player) return; // First check if player exists

        const players = this.players.value;
        if (!players.length) return;

        const playerExists = players.find((p) => p.username === player.username);
        if (!playerExists) return;

        const index = players.findIndex((p) => p.username === player.username);
        players.splice(index, 1);
        this.players.next(players);
    }

    removeAllPlayers(): void {
        this.players.next([]);
    }
}
