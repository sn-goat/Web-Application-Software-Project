import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { BoardCellComponent } from '@app/components/edit/board-cell/board-cell.component';
import { GameService } from '@app/services/code/game.service';
import { PlayerToolsService } from '@app/services/code/player-tools.service';
import { Cell } from '@common/board';
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
    selectedCell: Cell | null = null;

    actionMode = false;
    isPlayerTurn = false;
    isDebugMode = false;

    path: Map<string, PathInfo> | null = new Map<string, PathInfo>();
    pathCells: Set<string> = new Set();
    highlightedPathCells: Set<string> = new Set();

    private gameService: GameService = inject(GameService);
    private playerToolsService: PlayerToolsService = inject(PlayerToolsService);
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
            this.gameService.map$.subscribe((map: Cell[][]) => {
                this.boardGame = map;
            }),

            this.playerToolsService.actionMode$.subscribe((mode: boolean) => {
                this.actionMode = mode;
            }),

            this.gameService.isPlayerTurn$.subscribe((isPlayerTurn: boolean) => {
                this.isPlayerTurn = isPlayerTurn;
            }),

            this.gameService.path$.subscribe((path: Map<string, PathInfo> | null) => {
                if (!path) {
                    this.path = null;
                    this.pathCells = new Set();
                    this.highlightedPathCells.clear();
                    return;
                }

                this.path = new Map(path);
                this.pathCells = new Set([...path.keys()]);
                this.cdr.detectChanges();
            }),

            this.gameService.isDebugMode$.subscribe((isDebugMode) => {
                this.isDebugMode = isDebugMode;
            }),
        );
    }

    onLeftClicked(cell: Cell) {
        if (this.isPlayerTurn) {
            if (this.actionMode) {
                this.selectedCell = cell;
                this.actionMode = false;
            } else {
                this.gameService.movePlayer(cell.position);
            }
        }
    }

    onRightClicked(cell: Cell) {
        if (this.isDebugMode && this.isPlayerTurn) {
            this.gameService.debugMovePlayer(cell.position);
        } else {
            console.log('Right clicked on cell', cell);
        }
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
