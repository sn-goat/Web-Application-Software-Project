import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/code/socket.service';
import { Board } from '@common/board';
import { BehaviorSubject } from 'rxjs';

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

    shareGameMap(): void {
        if (this.gameMap.value.board) {
            this.socketService.shareGameMap(this.gameMap.value);
        }
    }

    getGameMapSize(): number {
        if (!this.gameMap.value.size) {
            return 0;
        }
        return this.gameMap.value.size;
    }
}
