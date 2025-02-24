import { Injectable } from '@angular/core';
import { Board } from '@common/board';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from '@app/services/code/socket.service';

@Injectable({
    providedIn: 'root',
})
export class GameMapService {
    private gameMap: BehaviorSubject<Board>;

    constructor(private socketService: SocketService) {
        this.gameMap = new BehaviorSubject<Board>({} as Board);
    }

    setGameMap(board: Board): void {
        this.gameMap.next(board);
    }

    getGameMap(): BehaviorSubject<Board> {
        return this.gameMap;
    }

    shareGameMap() {
        if (this.gameMap.value) {
            this.socketService.shareGameMap(this.gameMap.value);
        }
    }
}
