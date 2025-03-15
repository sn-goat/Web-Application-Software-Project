import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@app/components/common/confirmation-dialog/confirmation-dialog.component';
import { SocketService } from '@app/services/code/socket.service';
import { Cell, Vec2 } from '@common/board';
import { Avatar, Game, PathInfo } from '@common/game';
import { PlayerStats } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { FightLogicService } from './fight-logic.service';
import { Tile } from '@common/enums';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    showFightInterface$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    map$: BehaviorSubject<Cell[][]> = new BehaviorSubject<Cell[][]>([]);
    currentPlayers$: BehaviorSubject<PlayerStats[]> = new BehaviorSubject<PlayerStats[]>([]);
    activePlayer$: BehaviorSubject<PlayerStats | null> = new BehaviorSubject<PlayerStats | null>(null);
    clientPlayer$: BehaviorSubject<PlayerStats | null> = new BehaviorSubject<PlayerStats | null>(null);
    path$: BehaviorSubject<Map<string, PathInfo> | null> = new BehaviorSubject<Map<string, PathInfo> | null>(null);
    isPlayerTurn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    isDebugMode$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private initialPlayers: PlayerStats[] = [];
    private organizerId: string = '';
    private accessCode: string;
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

    isPlayerAdminOfGame(): boolean {
        return this.organizerId === this.clientPlayer$.value?.id;
    }

    isPlayerTurn(player: PlayerStats): void {
        const clientPlayer = this.clientPlayer$.value;
        if (player && clientPlayer && player.id === clientPlayer.id) {
            this.isPlayerTurn$.next(true);
            this.clientPlayer$.next(player);
        } else {
            this.isPlayerTurn$.next(false);
        }
    }

    getInitialPlayers(): PlayerStats[] {
        return this.initialPlayers;
    }

    getOrganizerId(): string {
        return this.organizerId;
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

        this.isDebugMode$.next(false);
        this.showFightInterface$.next(false);

        this.initialPlayers = game.players;
        this.accessCode = game.accessCode;
        this.organizerId = game.organizerId;
    }

    updateTurn(player: PlayerStats, path: Map<string, PathInfo>): void {
        this.activePlayer$.next(player);
        this.isPlayerTurn(player);
        this.path$.next(path);
    }

    debugMovePlayer(cell: Cell): void {
        if (this.canTeleport(cell)) {
            this.socketService.debugMove(this.accessCode, cell.position);
        }
    }

    canTeleport(cell: Cell): boolean {
        return (
            (cell.player === undefined || cell.player === Avatar.Default) &&
            cell.tile !== Tile.WALL &&
            cell.tile !== Tile.CLOSED_DOOR &&
            cell.tile !== Tile.OPENED_DOOR
        );
    }
    movePlayer(position: Vec2): void {
        const keyPos = `${position.x},${position.y}`;
        const selectedPath = this.path$.value?.get(keyPos);
        if (selectedPath) {
            this.isPlayerTurn$.next(false);
            this.socketService.movePlayer(this.accessCode, selectedPath);
        }
    }

    toggleDebugMode(): void {
        if (this.isPlayerAdminOfGame()) {
            this.socketService.toggleDebugMode(this.accessCode);
        }
    }

    onDebugStateChange(): void {
        this.isDebugMode$.next(!this.isDebugMode$.value);
    }

    onMove(position: Vec2, direction: Vec2): void {
        // console.log(`Moving player to ${direction.x},${direction.y}`);
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
