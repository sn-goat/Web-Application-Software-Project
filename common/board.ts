import { BoardVisibility, TileType } from './enums';
import { Vec2 } from './vec2';

export interface BoardCell {
    position: Vec2;
    tile: TileType;
    item: string | null;
}

export interface Board {
    _id: string;
    name: string;
    description: string;
    size: number;
    isCTF: boolean;
    board: BoardCell[][];
    visibility: BoardVisibility;
    image: string;
    lastUpdatedAt: Date;
}
