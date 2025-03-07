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

    private playerName: string;
    private activePlayer = new BehaviorSubject<string>('');
    private admin = new BehaviorSubject<string>('');
    private players = new BehaviorSubject<Player[]>([]);

    constructor() {
        this.activePlayer$ = this.activePlayer.asObservable();
        this.players$ = this.players.asObservable();
        this.admin$ = this.admin.asObservable();
    }

    setActivePlayer(name: string): void {
        this.activePlayer.next(name);
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

    getPlayer(name: string): Player | undefined {
        if (!name) {
            return undefined;
        }
        return this.players.value.find((player) => player.name === name);
    }

    editPlayer(player: Player): void {
        if (!player) return;

        const players: Player[] = this.players.value;
        const playerToUpdate = this.getPlayer(player.name);
        if (!playerToUpdate || playerToUpdate.name !== this.playerName) {
            return;
        }

        const index = players.findIndex((p) => p.name === player.name);
        if (index >= 0) {
            players[index] = player;
            this.players.next(players);
        }
    }

    removePlayerByName(name: string): boolean {
        const player = this.getPlayer(name);
        if (player) {
            this.removePlayer(player);
            return true;
        }
        return false;
    }

    setPlayerName(name: string): void {
        this.playerName = name;
    }

    getPlayerName(): string {
        return this.playerName;
    }

    setAdmin(name: string): void {
        this.admin.next(name);
    }

    addPlayer(player: Player): void {
        if (!player) return;

        const players = this.players.value;
        const playerExists = players.find((p) => p.name === player.name);
        if (!playerExists || players.length >= MAX_PLAYERS) {
            return;
        }
        players.push(player);
        this.players.next([...players]);
    }

    removePlayer(player: Player): void {
        if (!player) return;

        const players = this.players.value;
        if (!players.length) return;

        const playerExists = players.find((p) => p.name === player.name);
        if (!playerExists) return;

        const index = players.findIndex((p) => p.name === player.name);
        players.splice(index, 1);
        this.players.next(players);
    }

    removeAllPlayers(): void {
        this.players.next([]);
    }
}
