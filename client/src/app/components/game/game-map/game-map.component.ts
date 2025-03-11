import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { BoardCellComponent } from '@app/components/edit/board-cell/board-cell.component';
import { GameService } from '@app/services/code/game.service';
import { PlayerToolsService } from '@app/services/code/player-tools.service';
import { Cell, Vec2 } from '@common/board';
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
    // Store the last clicked cell when in Action mode.
    selectedCell: Cell | null = null;
    actionMode = false;
    isPlayerTurn = false;
    path: Map<Vec2, PathInfo> | null = new Map<Vec2, PathInfo>();

    private gameService: GameService = inject(GameService);
    private playerToolsService: PlayerToolsService = inject(PlayerToolsService);
    private subscriptions: Subscription[] = [];

    ngOnInit() {
        // Subscribe to the game map observable.
        this.subscriptions.push(
            this.gameService.map$.subscribe((map: Cell[][]) => {
                this.boardGame = map;
            }),
        );
        // Subscribe to the action mode flag from the PlayerToolsService.
        this.subscriptions.push(
            this.playerToolsService.actionMode$.subscribe((mode: boolean) => {
                this.actionMode = mode;
            }),
        );

        this.subscriptions.push(
            this.gameService.isPlayerTurn$.subscribe((isPlayerTurn: boolean) => {
                this.isPlayerTurn = isPlayerTurn;
            }),
        );

        this.subscriptions.push(
            this.gameService.path$.subscribe((path: Map<string, PathInfo> | null) => {
                if (!path) {
                    this.path = null;
                    return;
                }

                this.path = new Map<Vec2, PathInfo>(
                    [...path.entries()].map(([key, value]) => {
                        const [x, y] = key.split(',').map(Number);
                        return [{ x, y }, value];
                    }),
                );
            }),
        );
    }

    onCellClicked(cell: Cell) {
        if (this.actionMode) {
            console.log('Action mode active: Clicked cell', cell);
            this.selectedCell = cell;
            this.actionMode = false;
        }
    }

    isPathCell(cell: Cell): boolean {
        if (!this.path) return false;
        return this.path.has(cell.position);
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
