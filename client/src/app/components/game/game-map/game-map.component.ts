import { ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { BoardCellComponent } from '@app/components/common/board-cell/board-cell.component';
import { SubLifecycleHandlerComponent } from '@app/components/common/sub-lifecycle-handler/subscription-lifecycle-handler.component';
import { FightLogicService } from '@app/services/fight-logic/fight-logic.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { PopupService } from '@app/services/popup/popup.service';
import { Cell, KEYPRESS_D } from '@common/board';
import { Item, Tile } from '@common/enums';
import { PathInfo } from '@common/game';
import { IPlayer } from '@common/player';
import { MouseHandlerDirective } from './mouse-handler.directive';

@Component({
    selector: 'app-game-map',
    templateUrl: './game-map.component.html',
    styleUrls: ['./game-map.component.scss'],
    imports: [BoardCellComponent, MouseHandlerDirective],
})
export class GameMapComponent extends SubLifecycleHandlerComponent implements OnInit {
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

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        if (event.key.toLowerCase() === KEYPRESS_D && !this.chatInputFocused) {
            event.preventDefault();
            this.gameService.toggleDebugMode();
        }
    }

    ngOnInit() {
        this.subscribeToGameService();
        this.subscribeToPlayerService();
        this.subscribeToPopupService();
        this.getTooltipContent = this.gameService.getCellDescription.bind(this.gameService);
    }

    onLeftClicked(cell: Cell) {
        this.rightSelectedCell = null;
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

    private subscribeToGameService() {
        this.autoSubscribe(this.gameService.map, (map: Cell[][]) => {
            this.boardGame = map;
        });

        this.autoSubscribe(this.gameService.isActionSelected, (isAction) => {
            this.isActionSelected = isAction;
            this.actionCells = isAction ? this.gameService.findPossibleActions(this.playerService.getPlayer().position) : new Set<string>();
        });

        this.autoSubscribe(this.gameService.isDebugMode, (isDebugMode) => {
            this.isDebugMode = isDebugMode;
        });
    }

    private subscribeToPlayerService() {
        this.autoSubscribe(this.playerService.isActivePlayer, (isPlayerTurn: boolean) => {
            this.isPlayerTurn = isPlayerTurn;
        });

        this.autoSubscribe(this.playerService.path, (path: Map<string, PathInfo> | null) => {
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
        });
    }

    private subscribeToPopupService() {
        this.autoSubscribe(this.popupService.popupVisible$, (isVisible) => {
            this.popupVisible = isVisible;
        });

        this.autoSubscribe(this.popupService.chatInputFocused$, (isFocused) => {
            this.chatInputFocused = isFocused;
        });
    }
}
