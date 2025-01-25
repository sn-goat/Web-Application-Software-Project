import { BoardStatus, BoardVisibility, TileType } from './enums';
import { Vec2 } from './vec2';

export interface BoardCell {
    position: Vec2;
    tile: TileType | null;
    item: string | null;
}

export interface Board {
    _id: string;
    name: string;
    description: string;
    size: number;
    category: string | null;
    isCTF: boolean;
    board: BoardCell[][];
    status: BoardStatus;
    visibility: BoardVisibility;
    image: string;
    createdAt?: Date;
    updatedAt?: Date;
}
