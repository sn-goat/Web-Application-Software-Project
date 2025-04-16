import { Item, Tile, Visibility } from './enums';
import { Avatar } from './game';

export interface Cell {
    position: Vec2;
    tile: Tile;
    item: Item;
    cost: number;
    player: Avatar;
}

export interface Board {
    _id?: string;
    name: string;
    description: string;
    size: number;
    isCTF: boolean;
    board: Cell[][];
    visibility: Visibility;
    updatedAt?: Date;
    createdAt?: Date;
}

export interface Vec2 {
    x: number;
    y: number;
}

export type Validation = {
    isValid: boolean;
    error?: string;
};

export const TILE_COST = new Map<Tile, number>([
    [Tile.Ice, 0],
    [Tile.Water, 2],
    [Tile.Wall, Infinity],
    [Tile.Floor, 1],
    [Tile.ClosedDoor, Infinity],
    [Tile.OpenedDoor, 1],
]);

export const LEFT_CLICK = 0;
export const RIGHT_CLICK = 2;
export const KEYPRESS_D = 'd';
export const DEFAULT_STORAGE_KEY = 'firstBoardValue';
