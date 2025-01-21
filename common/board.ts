import { BoardStatus, BoardVisibility, TileType } from './enums';

export interface BoardCell {
    row: number;
    column: number;
    tile: TileType | null;
    item: string;
}

export interface Board {
    _id: string;
    name: string;
    description: string;
    size: number;
    isCTF: boolean;
    board: BoardCell[][];
    status: BoardStatus;
    visibility: BoardVisibility;
    createdAt?: Date;
    updatedAt?: Date;
}
