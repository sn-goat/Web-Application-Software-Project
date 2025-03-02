import { Injectable } from '@angular/core';
import { Player } from '@common/player';
import { BehaviorSubject, Observable } from 'rxjs';
import { MAX_PLAYERS } from '@app/constants/playerConst';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    activePlayer$: Observable<Player>;
    players$: Observable<Set<Player>>;

    // This is a mock player for testing purposes
    mockPlayer: Player = {
        id: '1',
        username: 'mockPlayer',
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
    private activePlayer = new BehaviorSubject<Player>({} as Player);
    private players = new BehaviorSubject<Set<Player>>(new Set([this.mockPlayer]));

    constructor() {
        this.activePlayer$ = this.activePlayer.asObservable();
        this.players$ = this.players.asObservable();
    }

    setActivePlayer(player: Player): void {
        this.activePlayer.next(player);
    }

    setPlayers(players: Set<Player>): void {
        if (players.size <= MAX_PLAYERS) {
            this.players.next(players);
        }
    }

    getPlayer(username: string): Player | undefined {
        if (!username) {
            return undefined;
        }
        return Array.from(this.players.value).find((player) => player.username === username);
    }

    editPlayer(player: Player): void {
        const players = this.players.value;
        const playerToUpdate = this.getPlayer(player.username);
        if (!player || !playerToUpdate || playerToUpdate.username !== this.playerUsername) {
            return;
        }

        if (this.removePlayerByName(player.username)) {
            this.addPlayer(player);
        }

        this.setPlayers(players);
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

    addPlayer(player: Player): void {
        const players = this.players.value;
        if (!player || players.has(player) || players.size >= MAX_PLAYERS) {
            return;
        }
        players.add(player);
        this.players.next(players);
    }

    removePlayer(player: Player): void {
        const players = this.players.value;
        if (!player || !players.has(player) || !players.size) {
            return;
        }
        players.delete(player);
        this.players.next(players);
    }

    removeAllPlayers(): void {
        this.players.next(new Set<Player>());
    }
}
