import { Item, Status, Tile, Visibility } from './enums';
import { Vec2 } from './vec2';

export interface Cell {
    position: Vec2;
    tile: Tile;
    item: Item;
}

export interface Board {
    _id: string;
    name: string;
    description: string;
    size: number;
    category: string | null;
    isCTF: boolean;
    board: Cell[][];
    status: Status;
    visibility: Visibility;
    image: string;
    createdAt: string | null;
    updatedAt: string | null;
}
