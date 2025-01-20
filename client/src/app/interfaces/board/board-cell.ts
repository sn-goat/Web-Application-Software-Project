import { Vec2 } from '@app/interfaces/vec2';

type TileType = 'Empty' | 'Water' | 'Wall' | 'Cosed Door' | 'path' | 'Open Door';

export interface BoardCell {
    position: Vec2;
    type: TileType;
}
