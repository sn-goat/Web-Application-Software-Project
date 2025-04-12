import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '@app/components/common/confirmation-dialog/confirmation-dialog.component';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { PlayerService } from '@app/services/player/player.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar, IGame, getAvatarName } from '@common/game';
import { DEFAULT_MOVEMENT_DIRECTIONS, IPlayer } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { Entry } from '@common/journal';
import { Stats } from '@common/stats';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    map: BehaviorSubject<Cell[][]> = new BehaviorSubject<Cell[][]>([]);
    playingPlayers: BehaviorSubject<IPlayer[]> = new BehaviorSubject<IPlayer[]>([]);
    initialPlayers: BehaviorSubject<IPlayer[]> = new BehaviorSubject<IPlayer[]>([]);
    activePlayer: BehaviorSubject<IPlayer | null> = new BehaviorSubject<IPlayer | null>(null);
    isDebugMode: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    isActionSelected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    journalEntries: BehaviorSubject<Entry[]> = new BehaviorSubject<Entry[]>([]);
    stats: BehaviorSubject<Stats | null> = new BehaviorSubject<Stats | null>(null);

    private organizerId: string = '';
    private dialog = inject(MatDialog);
    private readonly socketEmitter: SocketEmitterService = inject(SocketEmitterService);
    private readonly socketReceiver: SocketReceiverService = inject(SocketReceiverService);
    private playerService = inject(PlayerService);

    constructor() {
        this.socketReceiver.onPlayersUpdated().subscribe((players) => {
            this.playingPlayers.next(players);
            this.updateInitialPlayers(players);
        });

        this.socketReceiver.onPlayerJoined().subscribe((room) => {
            this.organizerId = room.organizerId;
        });

        this.socketReceiver.onGameStarted().subscribe((game) => {
            this.setGame(game);
        });

        this.socketReceiver.onDebugModeChanged().subscribe((isDebug) => {
            this.setDebugMode(isDebug);
        });

        this.socketReceiver.onPlayerTurnChanged().subscribe((turn) => {
            this.updateTurn(turn.player);
            this.isActionSelected.next(false);
        });

        this.socketReceiver.onPlayerMoved().subscribe((movement) => {
            this.onMove(movement.previousPosition, movement.player);
        });

        this.socketReceiver.onDoorStateChanged().subscribe((door) => {
            const newMap = this.map.value;
            newMap[door.doorPosition.y][door.doorPosition.x].tile = door.newDoorState;
            this.map.next(newMap);
            this.isActionSelected.next(false);
        });

        this.socketReceiver.onEndFight().subscribe((players: IPlayer[] | null) => {
            if (players !== null) {
                this.playingPlayers.next(players);
                this.updateInitialPlayers(players);
            }
            this.toggleActionMode();
        });

        this.socketReceiver.onGameEnded().subscribe(() => {
            this.resetGame();
        });

        this.socketReceiver.onJournalEntry().subscribe((entry) => {
            this.journalEntries.next([...this.journalEntries.getValue(), entry]);
        });

        this.socketReceiver.onStatsUpdate().subscribe((stats) => {
            this.stats.next(stats);
        });
    }

    initFight(avatar: Avatar): void {
        const myPlayer = this.playerService.getPlayer();
        const findDefender: IPlayer | null = this.findDefender(avatar);
        if (findDefender && myPlayer) {
            this.socketEmitter.initFight(myPlayer.id, findDefender.id);
        }
    }

    toggleActionMode(): void {
        if (this.activePlayer.value && this.activePlayer.value?.actions > 0) {
            this.isActionSelected.next(!this.isActionSelected.value);
        }
    }

    toggleDoor(position: Vec2): void {
        this.socketEmitter.changeDoorState(position, this.playerService.getPlayer().id);
    }

    isWithinActionRange(cell: Cell): boolean {
        if (!this.isValidCellForAction(cell)) return false;
        const playerPos = this.activePlayer.value?.position;
        if (!playerPos) return false;
        const actionPos = cell.position;
        const dx = Math.abs(playerPos.x - actionPos.x);
        const dy = Math.abs(playerPos.y - actionPos.y);
        return dx + dy === 1;
    }

    isPlayerInGame(player: IPlayer): boolean {
        return this.initialPlayers.value.some((currentPlayer) => currentPlayer.id === player.id);
    }

    getInitialPlayers(): IPlayer[] {
        return this.initialPlayers.value;
    }

    updateInitialPlayers(players: IPlayer[]): void {
        const currentInitialPlayers = [...this.initialPlayers.value];
        const updatedInitialPlayers = currentInitialPlayers.map((initialPlayer) => {
            const updatedPlayer = players.find((player) => player.id === initialPlayer.id);
            return updatedPlayer || initialPlayer;
        });
        this.initialPlayers.next(updatedInitialPlayers);
    }

    setGame(game: IGame): void {
        this.map.next(game.map);
        this.playingPlayers.next(game.players);
        this.activePlayer.next(game.players[game.currentTurn]);
        this.isDebugMode.next(false);
        this.initialPlayers.next(game.players);
    }

    updateTurn(player: IPlayer): void {
        this.activePlayer.next(player);
    }

    debugMovePlayer(cell: Cell): void {
        if (this.canTeleport(cell)) {
            this.socketEmitter.debugMove(cell.position, this.playerService.getPlayer().id);
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
            this.socketEmitter.toggleDebug();
        }
    }

    setDebugMode(isDebugMode: boolean): void {
        this.isDebugMode.next(isDebugMode);
    }

    onMove(previousPosition: Vec2, player: IPlayer): void {
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
        this.isActionSelected.next(false);
        this.playerService.setPlayerActive(false);
        this.socketEmitter.endTurn();
    }

    resetGame(): void {
        this.map.next([]);
        this.playingPlayers.next([]);
        this.activePlayer.next(null);
        this.isDebugMode.next(false);
        this.isActionSelected.next(false);
        this.initialPlayers.next([]);
        this.journalEntries.next([]);
        this.stats.next(null);
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

    async confirmAndQuitGame(): Promise<boolean> {
        return new Promise((resolve) => {
            const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                width: '350px',
                data: {
                    title: 'Quitter la partie',
                    message: 'Êtes-vous sûr de vouloir quitter cette partie ?',
                    confirmText: 'Quitter',
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

    getOrganizerId(): string {
        return this.organizerId;
    }

    private findDefender(avatar: Avatar): IPlayer | null {
        return this.playingPlayers.value.find((player) => player.avatar === avatar) ?? null;
    }
    private isValidCellForAction(cell: Cell): boolean {
        const myPlayer = this.playerService.getPlayer();
        const defender = this.findDefender(cell.player);
        if (defender) {
            return !defender.team || myPlayer.team !== defender.team;
        }
        return cell.tile === Tile.CLOSED_DOOR || cell.tile === Tile.OPENED_DOOR;
    }
}
