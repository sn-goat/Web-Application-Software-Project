import { Cell } from '@common/board';
import { Visibility } from '@common/enums';
import { ApiProperty } from '@nestjs/swagger';

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

    @ApiProperty({ description: 'Board state' })
    board: Cell[][];

    @ApiProperty({ description: 'Whether the board is available to everyone', required: false })
    visibility: Visibility;

    @ApiProperty({ description: 'Date when board last updated' })
    updatedAt: Date;

    @ApiProperty({ description: 'Date when created' })
    createdAt: Date;
}
