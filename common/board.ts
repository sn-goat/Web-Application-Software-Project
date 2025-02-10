import { Item, Tile, Visibility } from './enums';
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
    isCTF: boolean;
    board: Cell[][];
    visibility: Visibility;
    image: string;
    updatedAt?: Date;
    createdAt?: Date;
}

export interface Vec2 {
    x: number;
    y: number;
}
