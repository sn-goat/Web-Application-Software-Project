import { Vec2 } from '@common/board';
import { Item, Tile } from '@common/enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class BoardDto {
    @ApiProperty()
    position: Vec2;

    @ApiProperty()
    @IsEnum(() => Tile)
    tile: Tile;

    @ApiProperty()
    @IsEnum(() => Item)
    item: Item;
}
