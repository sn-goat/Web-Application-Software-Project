import { Injectable } from '@angular/core';
import { SocketService } from '@app/services/code/socket.service';
import { Board } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameMapService {
    private gameMap: BehaviorSubject<Board>;

    constructor(private socketService: SocketService) {
        // This is temporary code to generate a default map
        const size = 20;
        const mockBoard = Array(size)
            .fill(null)
            .map((_, rowIndex) =>
                Array(size)
                    .fill(null)
                    .map((__, colIndex) => ({
                        tile: Tile.FLOOR,
                        item: Item.DEFAULT,
                        position: { x: colIndex, y: rowIndex },
                    })),
            );
        const defaultBoard: Board = {
            board: mockBoard,
            size,
            name: 'Default Map',
            description: 'Default map description',
            isCTF: false,
            visibility: Visibility.PRIVATE,
            image: '',
        };
        this.gameMap = new BehaviorSubject<Board>(defaultBoard);
    }

    setGameMap(board: Board): void {
        this.gameMap.next(board);
    }

    getGameMap(): BehaviorSubject<Board> {
        return this.gameMap;
    }

    shareGameMap(): void {
        if (this.gameMap.value) {
            this.socketService.shareGameMap(this.gameMap.value);
        }
    }
}
