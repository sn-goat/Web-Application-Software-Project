import { BoardVisibility, ItemType, TileType } from './enums';
import { Vec2 } from './vec2';

export interface BoardCell {
    position: Vec2;
    tile: TileType;
    item: ItemType;
}

export interface Board {
    _id: string;
    name: string;
    description: string;
    size: number;
    category: string | null;
    isCTF: boolean;
    board: BoardCell[][];
    visibility: BoardVisibility;
    image: string;
    createdAt: string | null;
    updatedAt: string | null;
}
