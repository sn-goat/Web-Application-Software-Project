import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Board } from '@common/board';
import { GameMapService } from '@app/services/code/game-map.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { BoardCellComponent } from '@app/components/edit/board-cell/board-cell.component';

@Component({
    selector: 'app-game-map',
    imports: [CommonModule, BoardCellComponent],
    templateUrl: './game-map.component.html',
    styleUrl: './game-map.component.scss',
})
export class GameMapComponent implements OnInit, OnDestroy {
    boardGame: Board;
    private boardSubscription: Subscription;

    private gameMapService: GameMapService = inject(GameMapService);

    ngOnInit() {
        this.boardSubscription = this.gameMapService.getGameMap().subscribe((board: Board) => {
            this.boardGame = board;
        });
    }

    ngOnDestroy() {
        this.boardSubscription.unsubscribe();
    }
}
