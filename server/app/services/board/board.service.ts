import { MOCK_STORED_BOARD_ARRAY } from '@app/mock-data/stored-board.mock';
import { Board, BoardDocument } from '@app/model/database/board';
import { CreateBoardDto } from '@app/model/dto/board/create-board.dto';
import { Tile, Visibility } from '@common/enums';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class BoardService {
    constructor(
        @InjectModel(Board.name) public boardModel: Model<BoardDocument>,
        private logger: Logger,
    ) {
        this.start();
    }

    async start() {
        if ((await this.boardModel.countDocuments()) === 0) {
            await this.populateDB();
        }
    }

    async getAllBoards(): Promise<Board[]> {
        return this.boardModel.find({});
    }

    async getBoard(boardName: string): Promise<Board> {
        return this.boardModel.findOne({ name: boardName });
    }

    async populateDB(): Promise<void> {
        try {
            await this.boardModel.insertMany(MOCK_STORED_BOARD_ARRAY);
        } catch (error) {
            return Promise.reject(`Error while trying to populate: ${error}`);
        }
    }

    async addBoard(board: CreateBoardDto): Promise<void> {
        if (!this.validateBoard(board)) {
            return Promise.reject('Invalid board');
        }
        try {
            await this.boardModel.create(board);
        } catch (error) {
            return Promise.reject(`Failed to insert board: ${error}`);
        }
    }

    async updateBoard(name: string, board: Partial<Board>): Promise<Board> {
        const updatedBoard = await this.boardModel.findOneAndUpdate({ name }, board, { new: true }).exec();

        if (!updatedBoard) {
            throw new NotFoundException(`Board with name "${name}" not found.`);
        }

        return updatedBoard;
    }

    async toggleVisibility(name: string): Promise<Board> {
        const board = await this.boardModel.findOne({ name }).exec();

        if (!board) {
            throw new NotFoundException(`Board with name "${name}" not found.`);
        }

        const newVisibility = board.visibility === Visibility.Public ? Visibility.Private : Visibility.Public;
        board.visibility = newVisibility;
        return await board.save();
    }

    async deleteBoardByName(name: string): Promise<void> {
        const result = await this.boardModel.deleteOne({ name }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException(`Board with name "${name}" not found.`);
        }
    }

    async deleteAllBoards(): Promise<void> {
        await this.boardModel.deleteMany({}).exec();
    }

    private async validateBoard(board: CreateBoardDto): Promise<boolean> {
        if (!(await this.isBoardNameUnique(board.name))) {
            return false;
        }
        if (!this.isHalfSurfaceCovered(board)) {
            return false;
        }
        return true;
    }

    private isHalfSurfaceCovered(boardGame: CreateBoardDto): boolean {
        let tilecount = 0;

        for (const row of boardGame.board) {
            for (const cell of row) {
                if (cell.tile === Tile.Wall) {
                    tilecount++;
                }
            }
        }

        return tilecount / 2 <= boardGame.size;
    }

    private async isBoardNameUnique(name: string): Promise<boolean> {
        const boardNames = await this.boardModel.findOne({ name }).exec();
        return boardNames === null;
    }
}
