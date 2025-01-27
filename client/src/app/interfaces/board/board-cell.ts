import { Vec2 } from '@common/vec2';
import { Tiles, Items } from '@app/enum/tile';

export interface BoardCell {
    position: Vec2;
    tile: Tiles;
    item: Items;
}
