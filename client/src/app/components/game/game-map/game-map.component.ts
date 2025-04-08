import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { BoardCellComponent } from '@app/components/common/board-cell/board-cell.component';
import { FightLogicService } from '@app/services/fight-logic/fight-logic.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { PopupService } from '@app/services/popup/popup.service';
import { Cell, KEYPRESS_D } from '@common/board';
import { Tile } from '@common/enums';
import { PathInfo } from '@common/game';
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
    leftSelectedCell: Cell | null = null;
    rightSelectedCell: Cell | null = null;

    isActionSelected = false;
    isPlayerTurn = false;
    isDebugMode = false;
    popupVisible = false;

    path: Map<string, PathInfo> | null = new Map<string, PathInfo>();
    pathCells: Set<string> = new Set();
    actionCells: Set<string> = new Set();
    highlightedPathCells: Set<string> = new Set();
    getTooltipContent: (cell: Cell) => string;
    private readonly gameService: GameService = inject(GameService);
    private readonly fightLogicService = inject(FightLogicService);
    private readonly playerService = inject(PlayerService);
    private readonly popupService = inject(PopupService);
    private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
    private subscriptions: Subscription[] = [];

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        if (event.key.toLowerCase() === KEYPRESS_D && !this.popupVisible) {
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
            })
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

                if (cell.tile === Tile.OPENED_DOOR || cell.tile === Tile.CLOSED_DOOR) {
                    this.gameService.toggleDoor(cell.position);
                    return;
                }
            }
            return;
        }

        this.playerService.sendMove(cell.position);
    }

    onRightClicked(cell: Cell) {
        if (this.isDebugMode && this.isPlayerTurn) {
            this.gameService.debugMovePlayer(cell);
        } else {
            if (
                this.rightSelectedCell &&
                cell.position.x === this.rightSelectedCell.position.x &&
                cell.position.y === this.rightSelectedCell.position.y
            ) {
                this.rightSelectedCell = null;
            } else {
                this.rightSelectedCell = cell;
            }
        }
    }

    getCellTooltip(cell: Cell): string | null {
        if (
            this.rightSelectedCell &&
            cell.position.x === this.rightSelectedCell.position.x &&
            cell.position.y === this.rightSelectedCell.position.y
        ) {
            return this.getTooltipContent(cell);
        }
        return null;
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
