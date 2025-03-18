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
    [Tile.ICE, 0],
    [Tile.WATER, 2],
    [Tile.WALL, Infinity],
    [Tile.FLOOR, 1],
    [Tile.CLOSED_DOOR, Infinity],
    [Tile.OPENED_DOOR, 1],
]);

export const LEFT_CLICK = 0;
export const RIGHT_CLICK = 2;
