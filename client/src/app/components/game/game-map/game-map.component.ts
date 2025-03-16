/* eslint-disable no-console */
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { BoardCellComponent } from '@app/components/edit/board-cell/board-cell.component';
import { GameService } from '@app/services/code/game.service';
import { Cell } from '@common/board';
import { PathInfo } from '@common/game';
import { Subscription } from 'rxjs';
import { MouseHandlerDirective } from './mouse-handler.directive';
import { FightLogicService } from '@app/services/code/fight-logic.service';
import { PlayerService } from '@app/services/code/player.service';
import { Tile } from '@common/enums';

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

    path: Map<string, PathInfo> | null = new Map<string, PathInfo>();
    pathCells: Set<string> = new Set();
    highlightedPathCells: Set<string> = new Set();

    private gameService: GameService = inject(GameService);
    private fightLogicService = inject(FightLogicService);
    private playerService = inject(PlayerService);

    private subscriptions: Subscription[] = [];
    constructor(private readonly cdr: ChangeDetectorRef) {}

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        if (event.key.toLowerCase() === 'd') {
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
            }),

            this.gameService.isDebugMode.subscribe((isDebugMode) => {
                this.isDebugMode = isDebugMode;
            }),
        );
    }

    onLeftClicked(cell: Cell) {
        if (this.isPlayerTurn) {
            if (this.isActionSelected && this.gameService.isWithinActionRange(cell)) {
                if (this.fightLogicService.isAttackProvocation(cell)) {
                    this.gameService.initFight(cell.player);
                } else if (cell.tile === Tile.OPENED_DOOR || cell.tile === Tile.CLOSED_DOOR) {
                    this.gameService.toggleDoor(cell.position);
                }
            } else {
                this.playerService.sendMove(cell.position);
            }
        }
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

    getTooltipContent(cell: Cell): string {
        return this.gameService.getCellDescription(cell);
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
