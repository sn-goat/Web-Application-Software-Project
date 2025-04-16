import { Board, BoardDocument } from '@app/model/database/board';
import { CreateBoardDto } from '@app/model/dto/board/create-board.dto';
import { UpdateBoardDto } from '@app/model/dto/board/update-board-dto';
import { Cell, Validation, Vec2 } from '@common/board';
import { Tile, Visibility } from '@common/enums';
import { DEFAULT_MOVEMENT_DIRECTIONS } from '@common/player';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
@Injectable()
export class BoardService {
    constructor(
        @InjectModel(Board.name) public boardModel: Model<BoardDocument>,
        private logger: Logger,
    ) {}

    async getAllBoards(): Promise<Board[]> {
        return this.boardModel.find({});
    }

    async getBoard(boardName: string): Promise<Required<Board>> {
        return this.boardModel.findOne({ name: boardName });
    }

    async addBoard(board: CreateBoardDto): Promise<void> {
        const validation = await this.validateBoard(board, true);
        if (!validation.isValid) {
            return Promise.reject(`Jeu invalide: ${validation.error}`);
        }
        try {
            await this.boardModel.create({ ...board, createdAt: new Date(), updatedAt: new Date(), visibility: Visibility.Private });
        } catch (error) {
            return Promise.reject(`Failed to insert board: ${error}`);
        }
    }

    async updateBoard(board: UpdateBoardDto): Promise<Board> {
        const validation = await this.validateBoard(board, false);
        if (!validation.isValid) {
            return Promise.reject(`Jeu invalide: ${validation.error}`);
        }
        const updatedBoard = await this.boardModel
            .findOneAndUpdate(
                { _id: board._id },
                {
                    ...board,
                    visibility: Visibility.Private,
                },
                { new: true },
            )
            .exec();
        if (!updatedBoard) {
            const newBoard = { ...board, createdAt: new Date(), updatedAt: new Date(), visibility: Visibility.Private };
            try {
                await this.boardModel.create(newBoard);
            } catch (error) {
                return Promise.reject(`Failed to insert board: ${error}`);
            }
            return newBoard;
        }

        return updatedBoard;
    }

    async toggleVisibility(name: string): Promise<void> {
        const board = await this.boardModel.findOne({ name }).exec();

        if (!board) {
            throw new NotFoundException(`Board with name "${name}" not found.`);
        }

        const newVisibility = board.visibility === Visibility.Public ? Visibility.Private : Visibility.Public;
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

    private async validateBoard(board: CreateBoardDto | UpdateBoardDto, newBoard: boolean): Promise<Validation> {
        if (board.board.length === 0) {
            return { isValid: false, error: 'Jeu vide' };
        }

        if (newBoard && !(await this.isBoardNameUnique(board.name))) {
            return { isValid: false, error: 'Nom du jeu doit être unique' };
        }
        if (this.isHalfSurfaceCovered(board)) {
            return { isValid: false, error: 'Plus de la moitié de la surface du jeu est couverte' };
        }
        if (this.inacessibleTiles(board)) {
            return { isValid: false, error: 'Il y a des tuiles inacessibles' };
        }
        const doorsValidation = this.areDoorsValid(board);
        if (!doorsValidation.isValid) {
            return { isValid: false, error: doorsValidation.error };
        }
        return { isValid: true };
    }

    private doorOnEdge(row: number, col: number, max: number): boolean {
        return row === 0 || col === 0 || row === max - 1 || col === max - 1;
    }

    private isDoorStructureValid(board: CreateBoardDto, row: number, col: number): boolean {
        const horizontalFloors = board.board[row][col - 1].tile !== Tile.Wall && board.board[row][col + 1].tile !== Tile.Wall;
        const verticalFloors = board.board[row - 1][col].tile !== Tile.Wall && board.board[row + 1][col].tile !== Tile.Wall;
        const horizontalWalls = board.board[row][col - 1].tile === Tile.Wall && board.board[row][col + 1].tile === Tile.Wall;
        const verticalWalls = board.board[row - 1][col].tile === Tile.Wall && board.board[row + 1][col].tile === Tile.Wall;

        return !((horizontalFloors && verticalWalls) || (verticalFloors && horizontalWalls));
    }

    private areDoorsValid(board: CreateBoardDto): Validation {
        const rows = board.board.length;
        const cols = board.board[0].length;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (board.board[i][j].tile === Tile.ClosedDoor || board.board[i][j].tile === Tile.OpenedDoor) {
                    if (this.doorOnEdge(i, j, rows)) {
                        return { isValid: false, error: 'Des portes sont placées sur les rebords du jeu' };
                    }

                    if (this.isDoorStructureValid(board, i, j)) {
                        return {
                            isValid: false,
                            error: 'Les portes doivent être encadrées par deux murs parallèles, et les deux autres côtés doivent rester ouverts.',
                        };
                    }
                }
            }
        }
        return { isValid: true };
    }

    private isHalfSurfaceCovered(boardGame: CreateBoardDto): boolean {
        let wallcount = 0;

        for (const row of boardGame.board) {
            for (const cell of row) {
                if (cell.tile === Tile.Wall) {
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
                if (board.board[i][j].tile !== Tile.Wall) {
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
        const directions: Vec2[] = DEFAULT_MOVEMENT_DIRECTIONS;

        const rows = board.length;
        const cols = board[0]?.length || 0;
        if (x < 0 || y < 0 || x >= rows || y >= cols) return;
        const key = `${x},${y}`;
        if (visited.has(key) || board[x][y].tile === Tile.Wall) return;

        visited.add(key);
        for (const dir of directions) {
            this.dfs(board, x + dir.x, y + dir.y, visited);
        }
    }
}
