/* eslint-disable no-console */
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@app/components/common/confirmation-dialog/confirmation-dialog.component';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { PlayerService } from '@app/services/player/player.service';
import { SocketService } from '@app/services/socket/socket.service';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar, Game, getAvatarName } from '@common/game';
import { DEFAULT_MOVEMENT_DIRECTIONS, PlayerStats } from '@common/player';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    map: BehaviorSubject<Cell[][]> = new BehaviorSubject<Cell[][]>([]);
    playingPlayers: BehaviorSubject<PlayerStats[]> = new BehaviorSubject<PlayerStats[]>([]);
    activePlayer: BehaviorSubject<PlayerStats | null> = new BehaviorSubject<PlayerStats | null>(null);
    isDebugMode: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    isActionSelected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private initialPlayers: PlayerStats[] = [];
    private accessCode: string;
    private organizerId: string;

    private dialog = inject(MatDialog);
    private socketService = inject(SocketService);
    private playerService = inject(PlayerService);

    constructor() {
        this.socketService.onTurnSwitch().subscribe((turn) => {
            this.updateTurn(turn.player);
            this.isActionSelected.next(false);
        });

        this.socketService.onEndFight().subscribe(() => {
            this.toggleActionMode();
        });

        this.socketService.onBroadcastMove().subscribe((payload) => {
            this.onMove(payload.previousPosition, payload.player);
        });

        this.socketService.onBroadcastDebugState().subscribe(() => {
            this.onDebugStateChange();
        });

        this.socketService.onBroadcastDebugEndState().subscribe(() => {
            this.onEndDebugState();
        });

        this.socketService.onBroadcastDoor().subscribe((payload) => {
            console.log('Changement de la porte à la position', payload.position, 'avec le nouvel état', payload.newState);
            const newMap = this.map.value;
            newMap[payload.position.y][payload.position.x].tile = payload.newState;
            this.map.next(newMap);
            this.isActionSelected.next(false);
        });

        this.socketService.onQuitGame().subscribe((game) => {
            console.log('Quitting game', game.players);
            this.playingPlayers.next(game.players);
            this.map.next(game.map);
        });

        this.socketService.onEndGame().subscribe((winner: PlayerStats) => {
            console.log(winner);
        });
    }

    initFight(avatar: Avatar): void {
        const myPlayer = this.playerService.getPlayer();
        const findDefender: PlayerStats | null = this.findDefender(avatar);
        if (findDefender && myPlayer) {
            this.socketService.initFight(this.accessCode, myPlayer.id, findDefender.id);
        }
    }

    findDefender(avatar: Avatar): PlayerStats | null {
        return this.playingPlayers.value.find((player) => player.avatar === avatar) ?? null;
    }

    toggleActionMode(): void {
        if (this.activePlayer.value && this.activePlayer.value?.actions > 0) {
            this.isActionSelected.next(!this.isActionSelected.value);
        }
    }

    toggleDoor(position: Vec2): void {
        this.socketService.changeDoorState(this.accessCode, position, this.playerService.getPlayer());
    }

    isWithinActionRange(cell: Cell): boolean {
        const playerPos = this.activePlayer.value?.position;
        if (!playerPos) return false;
        const actionPos = cell.position;
        const dx = Math.abs(playerPos.x - actionPos.x);
        const dy = Math.abs(playerPos.y - actionPos.y);
        return dx + dy === 1;
    }

    isPlayerInGame(player: PlayerStats): boolean {
        return this.playingPlayers.value.some((currentPlayer) => currentPlayer.id === player.id);
    }

    getInitialPlayers(): PlayerStats[] {
        return this.initialPlayers;
    }

    removePlayerInGame(player: PlayerStats): void {
        if (this.isPlayerInGame(player)) {
            const updatePlayers = this.playingPlayers.value.filter((currentPlayer) => currentPlayer.id !== player.id);
            this.playingPlayers.next(updatePlayers);
        }
    }

    setGame(game: Game): void {
        this.map.next(game.map);
        this.playingPlayers.next(game.players);
        this.activePlayer.next(game.players[game.currentTurn]);
        this.isDebugMode.next(false);

        this.initialPlayers = game.players;
        this.accessCode = game.accessCode;
        this.organizerId = game.organizerId;
    }

    updateTurn(player: PlayerStats): void {
        this.activePlayer.next(player);
    }

    debugMovePlayer(cell: Cell): void {
        if (this.canTeleport(cell)) {
            this.socketService.debugMove(this.accessCode, cell.position, this.playerService.getPlayer());
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

    toggleDebugMode(): void {
        if (this.playerService.isPlayerAdmin()) {
            this.socketService.toggleDebugMode(this.accessCode);
        }
    }

    onDebugStateChange(): void {
        this.isDebugMode.next(!this.isDebugMode.value);
    }

    onEndDebugState(): void {
        this.isDebugMode.next(false);
    }

    onMove(previousPosition: Vec2, player: PlayerStats): void {
        const map: Cell[][] = this.map.value;
        if (player) {
            map[previousPosition.y][previousPosition.x].player = Avatar.Default;
            map[player.position.y][player.position.x].player = player.avatar as Avatar;
            if (this.activePlayer.value && this.activePlayer.value.id === player.id) {
                this.activePlayer.next(player);
            }

            if (this.playerService.getPlayer().id === player.id) {
                this.playerService.setPlayer(player);
            }
            this.map.next(map);
        }
    }

    endTurn(): void {
        this.toggleActionMode();
        this.socketService.endTurn(this.accessCode);
    }

    resetGame(): void {
        this.map.next([]);
        this.playingPlayers.next([]);
        this.activePlayer.next(null);
        this.isDebugMode.next(false);
        this.isActionSelected.next(false);
        this.initialPlayers = [];
        this.accessCode = '';
        this.organizerId = '';
    }

    async confirmAndAbandonGame(): Promise<boolean> {
        return new Promise((resolve) => {
            const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                width: '350px',
                data: {
                    title: 'Abandonner la partie',
                    message: 'Êtes-vous sûr de vouloir abandonner cette partie ?',
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

    getCellDescription(cell: Cell): string {
        if (cell.player) {
            const currentPlayers = this.playingPlayers.value;
            const playerInfo = currentPlayers.find((player) => player.avatar === cell.player) || { name: 'Unknown' };

            return 'Joueur: ' + playerInfo.name + ' Avatar: ' + getAvatarName(cell.player);
        }
        const tileDesc = this.getTileDescription(cell.tile);
        let desc = tileDesc;
        if (cell.item && cell.item !== (Item.DEFAULT as unknown as Item)) {
            const itemDesc = this.getItemDescription(cell.item);
            desc += ', ' + itemDesc;
        }
        return desc;
    }

    getTileDescription(tile: Tile): string {
        return ASSETS_DESCRIPTION.get(tile) || 'Aucune description';
    }

    getItemDescription(item: Item): string {
        return ASSETS_DESCRIPTION.get(item) || 'Aucune description';
    }

    getOrganizerId(): string {
        return this.organizerId;
    }

    findPossibleActions(position: Vec2): Set<string> {
        const possibleActions = new Set<string>();
        const directions: Vec2[] = DEFAULT_MOVEMENT_DIRECTIONS;
        for (const dir of directions) {
            const newPos: Vec2 = { x: position.x + dir.x, y: position.y + dir.y };
            if (newPos.y >= 0 && newPos.y < this.map.value.length && newPos.x >= 0 && newPos.x < this.map.value[0].length) {
                if (this.isValidCellForAction(this.map.value[newPos.y][newPos.x])) {
                    possibleActions.add(`${newPos.x},${newPos.y}`);
                }
            }
        }
        return possibleActions;
    }

    private isValidCellForAction(cell: Cell): boolean {
        return (cell.player !== undefined && cell.player !== Avatar.Default) || cell.tile === Tile.CLOSED_DOOR || cell.tile === Tile.OPENED_DOOR;
    }
}
