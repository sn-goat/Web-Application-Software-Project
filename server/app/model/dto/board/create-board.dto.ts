import { Cell } from '@common/board';
import { Visibility } from '@common/enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateBoardDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ description: 'Board description' })
    description: string;

    @ApiProperty({ description: 'Number representing the size of a single board column', examples: ['10', '16', '20'] })
    size: number;

    @ApiProperty({ description: 'Is the board made for the CTF game mode' })
    isCTF: boolean;

    @ApiProperty({ description: 'Board state' })
    board: Cell[][];

    @ApiProperty({ description: 'Whether the board is available to everyone', required: false })
    visibility: Visibility;
}
