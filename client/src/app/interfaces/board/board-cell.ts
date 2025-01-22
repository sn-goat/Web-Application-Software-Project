import { Vec2 } from '@app/interfaces/vec2';
import { Tiles, Items } from '@app/enum/tile';

export interface BoardCell {
    position: Vec2;
    tile: Tiles;
    item: Items;
}
