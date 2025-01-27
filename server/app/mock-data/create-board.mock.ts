import { CreateBoardDto } from '@app/model/dto/board/create-board.dto';
import { BoardStatus, BoardVisibility } from '@common/enums';

export const EMPTY_BOARD: CreateBoardDto = {
    name: 'mock_board1',
    description: 'test board #1',
    size: 16,
    isCTF: false,
    board: [[]],
    category: 'fun',
    visibility: BoardVisibility.Public,
    status: BoardStatus.Completed,
    image: 'random/url/',
};

export const VALID_BOARD: CreateBoardDto = {
    name: 'mock_board2',
    description: 'test board #2',
    size: 20,
    isCTF: false,
    board: [[]],
    category: 'strategy',
    visibility: BoardVisibility.Public,
    status: BoardStatus.Ongoing,
    image: 'random/url/',
};

export const INVALID_BOARD1: CreateBoardDto = {
    name: 'mock_board3',
    description: 'test board #3',
    size: 18,
    isCTF: true,
    board: [[]],
    category: 'horror',
    visibility: BoardVisibility.Public,
    status: BoardStatus.Completed,
    image: 'random/url/',
};

export const INVALID_BOARD2: CreateBoardDto = {
    name: 'mock_board4',
    description: 'test board #4',
    size: 16,
    isCTF: true,
    board: [[]],
    category: 'fantasy',
    visibility: BoardVisibility.Public,
    status: BoardStatus.Completed,
    image: 'random/url/',
};

export const MOCK_BOARD_ARRAY: CreateBoardDto[] = [EMPTY_BOARD, VALID_BOARD, INVALID_BOARD1, INVALID_BOARD2];
