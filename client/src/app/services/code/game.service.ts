import { Injectable, inject } from '@angular/core';
import { PlayerService } from '@app/services/code/player.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    playersWinsMap$: Observable<Map<string, number>>;
    playersInGameMap$: Observable<Map<string, boolean>>;

    private playersWinsMap: BehaviorSubject<Map<string, number>> = new BehaviorSubject<Map<string, number>>(new Map());
    private playersInGameMap: BehaviorSubject<Map<string, boolean>> = new BehaviorSubject<Map<string, boolean>>(new Map());
    private playerService: PlayerService = inject(PlayerService);

    constructor() {
        this.playersWinsMap$ = this.playersWinsMap.asObservable();
        this.playersInGameMap$ = this.playersInGameMap.asObservable();

        this.playerService.players$.subscribe((players) => {
            const newMap = new Map(this.playersWinsMap.value);
            const playersInGame = new Map<string, boolean>();
            players.forEach((player) => {
                if (!newMap.has(player.username)) {
                    newMap.set(player.username, 0);
                }
                if (!playersInGame.has(player.username)) {
                    playersInGame.set(player.username, true);
                }
            });
            this.playersWinsMap.next(newMap);
            this.playersInGameMap.next(playersInGame);
        });
    }

    getWinCount(username: string): number | undefined {
        return this.playersWinsMap.value.get(username);
    }

    abandonGame(username: string): void {
        if (this.playersInGameMap.value.has(username)) {
            const currentMap = this.playersInGameMap.value;
            const newMap = new Map(currentMap);

            const isInGame = currentMap.get(username);

            if (isInGame) {
                newMap.set(username, false);
                this.playersInGameMap.next(newMap);
            }
        }
    }

    incrementWinCount(username: string): void {
        if (this.playersWinsMap.value.has(username)) {
            const currentMap = this.playersWinsMap.value;
            const newMap = new Map(currentMap);

            const winCount = currentMap.get(username) ?? 0;

            newMap.set(username, winCount + 1);
            this.playersWinsMap.next(newMap);
        }
    }
}
