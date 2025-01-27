import { Board } from '@app/model/database/board';
import { BoardStatus, BoardVisibility } from '@common/enums';

export const EMPTY_BOARD: Board = {
    name: 'mock_board1',
    description: 'test board #1',
    size: 16,
    isCTF: false,
    board: [[]],
    category: 'fun',
    visibility: BoardVisibility.Public,
    status: BoardStatus.Completed,
    image: 'random/url/',
    updatedAt: new Date(),
    createdAt: new Date('2024,01,01'),
};

export const VALID_BOARD: Board = {
    name: 'mock_board2',
    description: 'test board #2',
    size: 20,
    isCTF: false,
    board: [[]],
    category: 'strategy',
    visibility: BoardVisibility.Public,
    status: BoardStatus.Ongoing,
    image: 'another/random/url',
    updatedAt: new Date('2025,01,15'),
    createdAt: new Date('2025,01,02'),
};

export const INVALID_BOARD1: Board = {
    name: 'mock_board3',
    description: 'test board #3',
    size: 18,
    isCTF: true,
    board: [[]],
    category: 'horror',
    visibility: BoardVisibility.Public,
    status: BoardStatus.Completed,
    image: 'random/url/',
    updatedAt: new Date(),
    createdAt: new Date('2025,01,02'),
};

export const INVALID_BOARD2: Board = {
    name: 'mock_board4',
    description: 'test board #4',
    size: 16,
    isCTF: true,
    board: [[]],
    category: 'fantasy',
    visibility: BoardVisibility.Public,
    status: BoardStatus.Completed,
    image: 'url',
    updatedAt: new Date(),
    createdAt: new Date(),
};

export const MOCK_STORED_BOARD_ARRAY: Board[] = [EMPTY_BOARD, VALID_BOARD, INVALID_BOARD1, INVALID_BOARD2];
