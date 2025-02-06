import { Item, Status, Tile, Visibility } from './enums';
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
    createdAt: Date | null;
    updatedAt: Date | null;
}

export interface Vec2 {
    x: number;
    y: number;
}