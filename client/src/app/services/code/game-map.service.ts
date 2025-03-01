import { Injectable } from '@angular/core';
import { Board } from '@common/board';
import { BehaviorSubject } from 'rxjs';
import { Item, Tile, Visibility } from '@common/enums';
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
        this.setGameMap({
            board: mockBoard,
            size,
            name: 'Default Map',
            description: 'Default map description',
            isCTF: false,
            visibility: Visibility.PRIVATE,
            image: '',
        });
        return this.gameMap;
    }

    shareGameMap(): void {
        if (this.gameMap.value) {
            this.socketService.shareGameMap(this.gameMap.value);
        }
    }

    getGameMapSize(): number {
        return this.gameMap.value.size;
    }
}
