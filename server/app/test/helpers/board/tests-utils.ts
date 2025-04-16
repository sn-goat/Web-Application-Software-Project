import { Cell, Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { Avatar } from '@common/game';

export function createBoard(size: number): Cell[][] {
    return Array.from({ length: size }, (_, i) =>
        Array.from({ length: size }, (unused, j) => ({
            position: { x: i, y: j },
            item: Item.Default,
            tile: Tile.Floor,
            player: Avatar.Default,
            cost: 1,
        })),
    );
}

export function placeTile(board: Cell[][], tile: Tile, position: Vec2): void {
    board[position.x][position.y].tile = tile;
}

export function placeUnreachableTile(board: Cell[][], position: Vec2): void {
    board[position.x][position.y].tile = Tile.Floor;
    board[position.x + 1][position.y].tile = Tile.Wall;
    board[position.x - 1][position.y].tile = Tile.Wall;
    board[position.x][position.y + 1].tile = Tile.Wall;
    board[position.x][position.y - 1].tile = Tile.Wall;
    board[position.x - 1][position.y + 1].tile = Tile.Wall;
    board[position.x + 1][position.y + 1].tile = Tile.Wall;
    board[position.x + 1][position.y - 1].tile = Tile.Wall;
    board[position.x - 1][position.y - 1].tile = Tile.Wall;
}
