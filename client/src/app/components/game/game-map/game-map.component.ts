import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { BoardCellComponent } from '@app/components/edit/board-cell/board-cell.component';
import { GameService } from '@app/services/code/game.service';
import { PlayerToolsService } from '@app/services/code/player-tools.service';
import { Cell } from '@common/board';
import { Subscription } from 'rxjs';
import { MouseHandlerDirective } from './mouse-handler.directive';
import { PathLike } from 'fs';
import { PathInfo } from '@common/game';

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
            this.gameService.activePlayer$.subscribe(() => {
                this.isPlayerTurn = this.gameService.isPlayerTurn();
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

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
