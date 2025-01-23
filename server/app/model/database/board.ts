import { BoardCell } from '@common/board';
import { BoardStatus, BoardVisibility } from '@common/enums';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type BoardDocument = Board & Document;

@Schema({ timestamps: true })
export class Board {
    @ApiProperty({ description: 'Unique name for the board' })
    @Prop({ required: true, unique: true })
    name: string;

    @ApiProperty({ description: 'Board description' })
    @Prop()
    description: string;

    @ApiProperty({ description: 'Number representing the size of a single board column', examples: ['16', '18', '20'] })
    @Prop({ required: true })
    size: number;

    @ApiProperty({ description: 'Is the board made for the CTF game mode' })
    @Prop({ required: true, default: false })
    isCTF: boolean;

    @ApiProperty({ description: 'Board state' })
    @Prop({ type: [[Object]], required: true })
    board: BoardCell[][];

    @ApiProperty({ description: 'Whether the user deems the board ready for gameplay' })
    @Prop({ required: true, enum: ['Ongoing', 'Completed'] })
    status: BoardStatus;

    @ApiProperty({ description: 'Whether the board is available to everyone' })
    @Prop({ required: true, enum: ['Public', 'Private'] })
    visibility: BoardVisibility;

    @ApiProperty({ description: 'Date when the board was created' })
    @Prop({ type: Date, required: true })
    createdAt: Date;

    @ApiProperty({ description: 'Date when the board was last modified' })
    @Prop({ required: true })
    updatedAt: Date;
}

export const boardSchema = SchemaFactory.createForClass(Board);
