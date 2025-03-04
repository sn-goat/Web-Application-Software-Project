import { Injectable, inject } from '@angular/core';
import { PlayerService } from '@app/services/code/player.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@app/components/common/confirmation-dialog/confirmation-dialog.component';
import { FightLogicService } from './fight-logic.service';
// import { SocketService } from '@app/services/code/socket.service';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    playersWinsMap$: Observable<Map<string, number>>;
    playersInGameMap$: Observable<Map<string, boolean>>;
    showFightInterface$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private playersWinsMap: BehaviorSubject<Map<string, number>> = new BehaviorSubject<Map<string, number>>(new Map());
    private playersInGameMap: BehaviorSubject<Map<string, boolean>> = new BehaviorSubject<Map<string, boolean>>(new Map());
    private playerService: PlayerService = inject(PlayerService);
    private dialog = inject(MatDialog);
    private fightLogicService = inject(FightLogicService);

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

        this.fightLogicService.fightStarted$.subscribe((started) => {
            this.showFightInterface$.next(started);
        });
    }

    getWinCount(username: string): number | undefined {
        return this.playersWinsMap.value.get(username);
    }

    async confirmAndAbandonGame(username: string): Promise<boolean> {
        return new Promise((resolve) => {
            const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                width: '350px',
                data: {
                    title: 'Abandonner la partie',
                    message: `Êtes-vous sûr de vouloir abandonner cette partie ${username}?`,
                    confirmText: 'Abandonner',
                    cancelText: 'Annuler',
                },
            });

            dialogRef.afterClosed().subscribe((result) => {
                if (result === true) {
                    this.abandonGame(username);
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }

    abandonGame(username: string): void {
        if (this.playersInGameMap.value.has(username)) {
            const currentMap = this.playersInGameMap.value;
            // const newMap = new Map(currentMap);

            const isInGame = currentMap.get(username);

            if (isInGame) {
                // newMap.set(username, false);
                // this.playersInGameMap.next(newMap);
                // to be implemented with socket
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

            // to be implemented with socket
        }
    }
}
