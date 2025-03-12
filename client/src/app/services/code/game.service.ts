import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@app/components/common/confirmation-dialog/confirmation-dialog.component';
import { SocketService } from '@app/services/code/socket.service';
import { Cell, Vec2 } from '@common/board';
import { Avatar, Game, PathInfo } from '@common/game';
import { PlayerStats } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { FightLogicService } from './fight-logic.service';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    showFightInterface$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    map$: BehaviorSubject<Cell[][]> = new BehaviorSubject<Cell[][]>([]);
    currentPlayers$: BehaviorSubject<PlayerStats[]> = new BehaviorSubject<PlayerStats[]>([]);
    activePlayer$: BehaviorSubject<PlayerStats | null> = new BehaviorSubject<PlayerStats | null>(null);
    clientPlayer$: BehaviorSubject<PlayerStats | null> = new BehaviorSubject<PlayerStats | null>(null);
    isPlayerTurn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private initialPlayers: PlayerStats[] = [];
    private accessCode: string;
    private path: Map<string, PathInfo> = new Map();
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

    isPlayerTurn(player: PlayerStats): boolean {
        const clientPlayer = this.clientPlayer$.value;
        return (player && clientPlayer && player.id === clientPlayer.id) as boolean;
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

    setGame(game: Game): void {
        this.map$.next(game.map);
        this.currentPlayers$.next(game.players);
        this.activePlayer$.next(game.players[game.currentTurn]);
        this.clientPlayer$.next(this.socketService.getCurrentPlayer());
        this.initialPlayers = game.players;
        this.accessCode = game.accessCode;
    }

    updateTurn(player: PlayerStats, path: Map<string, PathInfo>): void {
        this.activePlayer$.next(player);
        this.isPlayerTurn$.next(this.isPlayerTurn(player));
        this.path = path;
    }

    movePlayer(position: Vec2): void {
        const keyPos = `${position.x},${position.y}`;
        const selectedPath = this.path.get(keyPos);
        if (selectedPath) {
            this.isPlayerTurn$.next(false);
            this.socketService.movePlayer(this.accessCode, selectedPath);
        }
    }
    onMove(position: Vec2, direction: Vec2): void {
        const map: Cell[][] = this.map$.value;
        const player = this.activePlayer$.value;
        if (player) {
            map[position.y][position.x].player = Avatar.Default;
            map[direction.y][direction.x].player = player.avatar as Avatar;
            player.position = position;
            this.activePlayer$.next(player);
            this.map$.next(map);
        }
    }

    setPath(path: Map<string, PathInfo>): void {
        this.path = path;
        path = this.path;
    }

    endTurn(): void {
        this.socketService.endTurn(this.accessCode);
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
