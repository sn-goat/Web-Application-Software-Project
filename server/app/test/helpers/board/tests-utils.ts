import { BoardCell } from '@common/board';
import { TileType } from '@common/enums';
import { Vec2 } from '@common/vec2';

export function createBoard(size: number): BoardCell[][] {
    return Array.from({ length: size }, (_, i) =>
        Array.from({ length: size }, (unused, j) => ({
            position: { x: i, y: j },
            item: null,
            tile: TileType.FLOOR,
        })),
    );
}

export function placeTile(board: BoardCell[][], tile: TileType, position: Vec2): void {
    board[position.x][position.y].tile = tile;
}

export function placeUnreachableTile(board: BoardCell[][], position: Vec2): void {
    board[position.x][position.y].tile = TileType.FLOOR;
    board[position.x + 1][position.y].tile = TileType.WALL;
    board[position.x - 1][position.y].tile = TileType.WALL;
    board[position.x][position.y + 1].tile = TileType.WALL;
    board[position.x][position.y - 1].tile = TileType.WALL;
    board[position.x - 1][position.y + 1].tile = TileType.WALL;
    board[position.x + 1][position.y + 1].tile = TileType.WALL;
    board[position.x + 1][position.y - 1].tile = TileType.WALL;
    board[position.x - 1][position.y - 1].tile = TileType.WALL;
}
