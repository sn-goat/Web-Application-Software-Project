import { Injectable } from '@angular/core';
import { Player } from '@common/player';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class PlayerService {
    activePlayer$: Observable<Player>;
    players$: Observable<Set<Player>>;

    private activePlayer = new BehaviorSubject<Player>({} as Player);
    private players = new BehaviorSubject<Set<Player>>(new Set());

    constructor() {
        this.activePlayer$ = this.activePlayer.asObservable();
        this.players$ = this.players.asObservable();
    }

    setActivePlayer(player: Player): void {
        this.activePlayer.next(player);
    }

    getActivePlayer(): BehaviorSubject<Player> {
        return this.activePlayer;
    }

    setPlayers(players: Set<Player>): void {
        this.players.next(players);
    }

    getPlayers(): BehaviorSubject<Set<Player>> {
        return this.players;
    }

    addPlayer(player: Player): void {
        const players = this.players.value;
        if (!player || players.has(player)) {
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
}
