import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { BoardCellComponent } from '@app/components/common/board-cell/board-cell.component';
import { FightLogicService } from '@app/services/fight-logic/fight-logic.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { PopupService } from '@app/services/popup/popup.service';
import { Cell, KEYPRESS_D } from '@common/board';
import { Item, Tile } from '@common/enums';
import { PathInfo } from '@common/game';
import { IPlayer } from '@common/player';
import { Subscription } from 'rxjs';
import { MouseHandlerDirective } from './mouse-handler.directive';

@Component({
    selector: 'app-game-map',
    templateUrl: './game-map.component.html',
    styleUrls: ['./game-map.component.scss'],
    imports: [BoardCellComponent, MouseHandlerDirective],
})
export class GameMapComponent implements OnInit, OnDestroy {
    boardGame: Cell[][] = [];

    isActionSelected = false;
    isPlayerTurn = false;
    popupVisible = false;
    chatInputFocused = false;

    path: Map<string, PathInfo> | null = new Map<string, PathInfo>();
    getTooltipContent: (cell: Cell) => string;
    private isDebugMode = false;
    private highlightedPathCells: Set<string> = new Set();
    private actionCells: Set<string> = new Set();
    private pathCells: Set<string> = new Set();
    private rightSelectedCell: Cell | null = null;
    private readonly gameService: GameService = inject(GameService);
    private readonly fightLogicService = inject(FightLogicService);
    private readonly playerService = inject(PlayerService);
    private readonly popupService = inject(PopupService);
    private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
    private subscriptions: Subscription[] = [];

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        if (event.key.toLowerCase() === KEYPRESS_D && !this.chatInputFocused) {
            event.preventDefault();
            this.gameService.toggleDebugMode();
        }
    }

    ngOnInit() {
        this.subscriptions.push(
            this.gameService.map.subscribe((map: Cell[][]) => {
                this.boardGame = map;
            }),

            this.playerService.isActivePlayer.subscribe((isPlayerTurn: boolean) => {
                this.isPlayerTurn = isPlayerTurn;
            }),

            this.playerService.path.subscribe((path: Map<string, PathInfo> | null) => {
                this.rightSelectedCell = null;
                if (!path) {
                    this.path = null;
                    this.pathCells = new Set();
                    this.highlightedPathCells.clear();
                    this.rightSelectedCell = null;
                    return;
                }

                this.path = new Map(path);
                this.pathCells = new Set([...path.keys()]);
                this.cdr.detectChanges();
            }),

            this.gameService.isActionSelected.subscribe((isAction) => {
                this.isActionSelected = isAction;
                this.actionCells = isAction ? this.gameService.findPossibleActions(this.playerService.getPlayer().position) : new Set<string>();
            }),

            this.gameService.isDebugMode.subscribe((isDebugMode) => {
                this.isDebugMode = isDebugMode;
            }),

            this.popupService.popupVisible$.subscribe((isVisible) => {
                this.popupVisible = isVisible;
            }),

            this.popupService.chatInputFocused$.subscribe((isFocused) => {
                this.chatInputFocused = isFocused;
            }),
        );
        this.getTooltipContent = this.gameService.getCellDescription.bind(this.gameService);
    }

    onLeftClicked(cell: Cell) {
        if (!this.isPlayerTurn) return;
        if (this.isActionSelected) {
            if (this.gameService.isWithinActionRange(cell)) {
                if (this.fightLogicService.isAttackProvocation(cell)) {
                    this.gameService.initFight(cell.player);
                    return;
                }
                if (cell.tile === Tile.OpenedDoor || cell.tile === Tile.ClosedDoor) {
                    const myPlayer = this.playerService.getPlayer();
                    const dx = Math.abs(myPlayer.position.x - cell.position.x);
                    const dy = Math.abs(myPlayer.position.y - cell.position.y);
                    if (dx > 0 && dy > 0) {
                        return;
                    }
                    this.gameService.toggleDoor(cell.position);
                    return;
                }
            }
            return;
        }

        const player = this.playerService.getPlayer();
        if (this.isPlayerAtSpawn(player) && player.inventory.includes(Item.MonsterEgg)) {
            this.gameService.debugMovePlayer(cell);
        } else {
            this.playerService.sendMove(cell.position);
        }
    }

    onRightClicked(cell: Cell) {
        if (this.isDebugMode && this.isPlayerTurn) {
            this.gameService.debugMovePlayer(cell);
            return;
        }

        this.rightSelectedCell =
            this.rightSelectedCell && cell.position.x === this.rightSelectedCell.position.x && cell.position.y === this.rightSelectedCell.position.y
                ? null
                : cell;
    }

    getCellTooltip(cell: Cell): string | null {
        return this.rightSelectedCell &&
            cell.position.x === this.rightSelectedCell.position.x &&
            cell.position.y === this.rightSelectedCell.position.y
            ? this.getTooltipContent(cell)
            : null;
    }

    isPathCell(cell: Cell): boolean {
        return this.pathCells.has(`${cell.position.x},${cell.position.y}`);
    }

    isHighlightedPathCell(cell: Cell): boolean {
        return this.highlightedPathCells.has(`${cell.position.x},${cell.position.y}`);
    }

    isActionCell(cell: Cell): boolean {
        return this.actionCells.has(`${cell.position.x},${cell.position.y}`);
    }

    isPlayerAtSpawn(player: IPlayer): boolean {
        return player && player.position.x === player.spawnPosition.x && player.position.y === player.spawnPosition.y;
    }

    onCellHovered(cell: Cell) {
        if (!this.path || !this.isPlayerTurn) return;

        const key = `${cell.position.x},${cell.position.y}`;
        if (!this.path.has(key)) {
            this.highlightedPathCells.clear();
            return;
        }

        this.highlightedPathCells = new Set(this.path.get(key)?.path.map((vec) => `${vec.x},${vec.y}`));
    }

    onCellUnhovered() {
        this.highlightedPathCells.clear();
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
