import { Board, BoardDocument } from '@app/model/database/board';
import { CreateBoardDto } from '@app/model/dto/board/create-board.dto';
import { MOCK_STORED_BOARD_ARRAY } from '@app/test/helpers/board/stored-board.mock';
import { Cell, Vec2 } from '@common/board';
import { Visibility, Tile } from '@common/enums';
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
        const validation = await this.validateBoard(board, true);
        if (!validation.isValid) {
            return Promise.reject(`Invalid board: ${validation.error}`);
        }
        try {
            await this.boardModel.create({ ...board, lastUpdatedAt: new Date() });
        } catch (error) {
            return Promise.reject(`Failed to insert board: ${error}`);
        }
    }

    async updateBoard(board: CreateBoardDto): Promise<Board> {
        const validation = await this.validateBoard(board, false);
        if (!validation.isValid) {
            return Promise.reject(`Invalid board: ${validation.error}`);
        }

        const updatedBoard = await this.boardModel.findOneAndUpdate({ name: board.name }, board, { new: true }).exec();

        if (!updatedBoard) {
            throw new NotFoundException(`Board with name "${name}" not found.`);
        }

        return updatedBoard;
    }

    async toggleVisibility(name: string): Promise<void> {
        const board = await this.boardModel.findOne({ name }).exec();

        if (!board) {
            throw new NotFoundException(`Board with name "${name}" not found.`);
        }

        const newVisibility = board.visibility === Visibility.PUBLIC ? Visibility.PRIVATE : Visibility.PUBLIC;
        board.visibility = newVisibility;
        await board.save();
    }

    async deleteBoardByName(name: string): Promise<void> {
        const result = await this.boardModel.deleteOne({ name }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException(`Board with name "${name}" not found.`);
        }
    }

    async deleteAllBoards(): Promise<void> {
        try {
            await this.boardModel.deleteMany({}).exec();
        } catch (error) {
            Promise.reject('Error while trying to delete all boards');
        }
    }

    private async validateBoard(board: CreateBoardDto, newBoard: boolean): Promise<Validation> {
        if (board.board.length === 0) {
            return { isValid: false, error: 'Empty board' };
        }

        if (newBoard && !(await this.isBoardNameUnique(board.name))) {
            return { isValid: false, error: 'Board name has to be unique' };
        }
        if (this.isHalfSurfaceCovered(board)) {
            return { isValid: false, error: 'More than half the surface is covered' };
        }
        if (this.inacessibleTiles(board)) {
            return { isValid: false, error: 'There are inacessible tiles' };
        }
        return { isValid: true };
    }

    private isHalfSurfaceCovered(boardGame: CreateBoardDto): boolean {
        let wallcount = 0;

        for (const row of boardGame.board) {
            for (const cell of row) {
                if (cell.tile === Tile.WALL) {
                    wallcount++;
                }
            }
        }
        return wallcount >= (boardGame.size * boardGame.size) / 2;
    }

    private async isBoardNameUnique(name: string): Promise<boolean> {
        const boardNames = await this.boardModel.findOne({ name }).exec();
        return boardNames === null;
    }

    private inacessibleTiles(board: CreateBoardDto): boolean {
        const rows = board.board.length;
        const cols = board.board[0]?.length || 0;
        if (rows === 0 || cols === 0) return false;

        let totalAccessibleTiles = 0;
        let start: Vec2 | null = null;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (board.board[i][j].tile !== Tile.WALL) {
                    totalAccessibleTiles++;
                    if (!start) {
                        start = { x: i, y: j };
                    }
                }
            }
        }
        if (!start) return false;

        const visited = new Set<string>();
        this.dfs(board.board, start.x, start.y, visited);
        return !(visited.size === totalAccessibleTiles);
    }

    private dfs(board: Cell[][], x: number, y: number, visited: Set<string>) {
        const directions: Vec2[] = [
            { x: 0, y: 1 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: -1, y: 0 },
        ];

        const rows = board.length;
        const cols = board[0]?.length || 0;
        if (x < 0 || y < 0 || x >= rows || y >= cols) return;
        const key = `${x},${y}`;
        if (visited.has(key) || board[x][y].tile === Tile.WALL) return;

        visited.add(key);
        for (const dir of directions) {
            this.dfs(board, x + dir.x, y + dir.y, visited);
        }
    }
}

export type Validation = {
    isValid: boolean;
    error?: string;
};
