import { Injectable } from '@angular/core';
import { Board } from '@common/board';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameMapService {
    private gameMap: BehaviorSubject<Board>;

    constructor() {
        this.gameMap = new BehaviorSubject<Board>({} as Board);
    }

    setGameMap(board: Board): void {
        this.gameMap.next(board);
    }

    getGameMap(): BehaviorSubject<Board> {
        return this.gameMap;
    }

    getGameMapSize(): number {
        if (!this.gameMap.value.size) {
            return 0;
        }
        return this.gameMap.value.size;
    }
}
