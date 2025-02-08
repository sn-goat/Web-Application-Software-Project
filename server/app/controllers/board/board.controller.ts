import { CreateBoardDto } from '@app/model/dto/board/create-board.dto';
import { BoardService } from '@app/services/board/board.service';
import { Body, Controller, Delete, Get, HttpStatus, NotFoundException, Param, Patch, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Boards')
@Controller('board')
export class BoardController {
    constructor(private readonly boardService: BoardService) {}

    @Get('/')
    async allBoards(@Res() response: Response) {
        try {
            const allBoards = await this.boardService.getAllBoards();
            response.status(HttpStatus.OK).json(allBoards);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @Get('/:name')
    async oneBoard(@Param('name') name: string, @Res() response: Response) {
        try {
            const board = await this.boardService.getBoard(name);
            if (!board) {
                throw new NotFoundException(`Board with name "${name}" not found`);
            }
            response.status(HttpStatus.OK).json(board);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @Post('/board')
    async addBoard(@Body() board: CreateBoardDto, @Res() response: Response) {
        try {
            await this.boardService.addBoard(board);
            response.status(HttpStatus.CREATED).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @Patch('/:name')
    async patchBoard(@Param('board') board: CreateBoardDto, @Res() response: Response) {
        try {
            const updatedBoard = await this.boardService.updateBoard(board);
            response.status(HttpStatus.OK).json(updatedBoard);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @Patch('/visibility/:name')
    async toggleBoardVisibility(@Param('name') name: string, @Res() response: Response) {
        try {
            await this.boardService.toggleVisibility(name);
            response.status(HttpStatus.ACCEPTED).send();
        } catch (error) {
            response.status(HttpStatus.UNAUTHORIZED).send(error.message);
        }
    }

    @Delete('/:name')
    async deleteBoardByName(@Param('name') name: string, @Res() response: Response) {
        try {
            await this.boardService.deleteBoardByName(name);
            response.status(HttpStatus.NO_CONTENT).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @Delete('/')
    async deleteAllBoards(@Res() response: Response) {
        try {
            await this.boardService.deleteAllBoards();
            response.status(HttpStatus.NO_CONTENT).send();
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }
}
