import { Cell, Vec2 } from '@common/board';
import { Tile } from '@common/enums';

export function createBoard(size: number): Cell[][] {
    return Array.from({ length: size }, (_, i) =>
        Array.from({ length: size }, (unused, j) => ({
            position: { x: i, y: j },
            item: null,
            tile: Tile.FLOOR,
        })),
    );
}

export function placeTile(board: Cell[][], tile: Tile, position: Vec2): void {
    board[position.x][position.y].tile = tile;
}

export function placeUnreachableTile(board: Cell[][], position: Vec2): void {
    board[position.x][position.y].tile = Tile.FLOOR;
    board[position.x + 1][position.y].tile = Tile.WALL;
    board[position.x - 1][position.y].tile = Tile.WALL;
    board[position.x][position.y + 1].tile = Tile.WALL;
    board[position.x][position.y - 1].tile = Tile.WALL;
    board[position.x - 1][position.y + 1].tile = Tile.WALL;
    board[position.x + 1][position.y + 1].tile = Tile.WALL;
    board[position.x + 1][position.y - 1].tile = Tile.WALL;
    board[position.x - 1][position.y - 1].tile = Tile.WALL;
}
