import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@app/components/common/confirmation-dialog/confirmation-dialog.component';
import { BehaviorSubject } from 'rxjs';
import { FightLogicService } from './fight-logic.service';
import { Game, PathInfo, TurnInfo } from '@common/game';
import { PlayerStats } from '@common/player';
import { Cell, Vec2 } from '@common/board';
import { SocketService } from '@app/services/code/socket.service';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    showFightInterface$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    map$: BehaviorSubject<Cell[][]> = new BehaviorSubject<Cell[][]>([]);
    currentPlayers$: BehaviorSubject<PlayerStats[]> = new BehaviorSubject<PlayerStats[]>([]);
    activePlayer$: BehaviorSubject<PlayerStats | null> = new BehaviorSubject<PlayerStats | null>(null);
    clientPlayer$: BehaviorSubject<PlayerStats | null> = new BehaviorSubject<PlayerStats | null>(null);

    private initialPlayers: PlayerStats[] = [];
    private accessCode: string;
    private path: Map<Vec2, PathInfo> = new Map();
    private dialog = inject(MatDialog);
    private fightLogicService = inject(FightLogicService);
    private socketService = inject(SocketService);

    constructor() {
        this.fightLogicService.fightStarted$.subscribe((started) => {
            this.showFightInterface$.next(started);
        });
    }

    isPlayerInGame(player: PlayerStats): boolean {
        return this.currentPlayers$.value.some((currentPlayer) => currentPlayer.id === player.id);
    }

    getInitialPlayers(): PlayerStats[] {
        return this.initialPlayers;
    }

    removePlayerInGame(player: PlayerStats): void {
        if (this.isPlayerInGame(player)) {
            const updatePlayers = this.currentPlayers$.value.filter((currentPlayer) => currentPlayer.id !== player.id);
            this.currentPlayers$.next(updatePlayers);
        }
    }

    setActivePlayer(playerIndex: number): void {
        this.activePlayer$.next(this.currentPlayers$.value[playerIndex]);
    }

    setGame(game: Game): void {
        this.map$.next(game.map);
        this.currentPlayers$.next(game.players);
        this.activePlayer$.next(game.players[game.currentTurn]);
        this.clientPlayer$.next(this.socketService.getCurrentPlayer());
        this.initialPlayers = game.players;
        this.accessCode = game.accessCode;
    }

    setTurn(turn: TurnInfo): void {
        this.activePlayer$.next(turn.player);
        if (turn.player.id === this.clientPlayer$.value?.id) {
            this.path = turn.path;
        }
    }

    getPath(path: Map<Vec2, PathInfo>): void {
        this.path = path;
    }

    async confirmAndAbandonGame(name: string): Promise<boolean> {
        return new Promise((resolve) => {
            const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                width: '350px',
                data: {
                    title: 'Abandonner la partie',
                    message: `Êtes-vous sûr de vouloir abandonner cette partie ${name}?`,
                    confirmText: 'Abandonner',
                    cancelText: 'Annuler',
                },
            });

            dialogRef.afterClosed().subscribe((result) => {
                if (result === true) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }

    getAccessCode(): string {
        return this.accessCode;
    }
}
