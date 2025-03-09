import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Cell } from '@common/board';
import { CommonModule } from '@angular/common';
import { BoardCellComponent } from '@app/components/edit/board-cell/board-cell.component';
import { GameService } from '@app/services/code/game.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-map',
    imports: [CommonModule, BoardCellComponent],
    templateUrl: './game-map.component.html',
    styleUrl: './game-map.component.scss',
})
export class GameMapComponent implements OnInit, OnDestroy {
    boardGame: Cell[][];

    private gameService: GameService = inject(GameService);
    private mapSub: Subscription;

    ngOnInit() {
        this.mapSub = this.gameService.map$.pipe().subscribe((map: Cell[][]) => {
            this.boardGame = map;
        });
    }

    ngOnDestroy() {
        this.mapSub.unsubscribe();
    }
}
