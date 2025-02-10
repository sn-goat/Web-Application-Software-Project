import { Visibility } from '@common/enums';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { BoardDto } from './board-dto';
export class UpdateBoardDto {
    @ApiProperty()
    _id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ description: 'Board description' })
    description: string;

    @ApiProperty({ description: 'Number representing the size of a single board column', examples: ['10', '15', '20'] })
    size: number;

    @ApiProperty({ description: 'Is the board made for the CTF game mode' })
    isCTF: boolean;

    @ApiProperty({
        type: [Array<BoardDto>],
        description: '2D array representing the board',
        example: [[{ row: 0, column: 0, tile: 'Ice', item: 'Sword' }], [{ row: 1, column: 1, tile: 'Water', item: 'Shield' }]],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Array<BoardDto>)
    board: BoardDto[][];

    @ApiProperty({ description: 'Whether the board is available to everyone', required: false })
    visibility: Visibility;

    @ApiProperty({ description: 'Miniature image of the board' })
    image: string;

    @ApiProperty({ description: 'Date when board last updated' })
    updatedAt: Date;

    @ApiProperty({ description: 'Date when created' })
    createdAt: Date;
}
