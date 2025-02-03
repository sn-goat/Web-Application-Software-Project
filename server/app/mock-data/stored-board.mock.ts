import { Board } from '@app/model/database/board';
import { BoardVisibility } from '@common/enums';

export const EMPTY_BOARD: Board = {
    name: 'mock_board1',
    description: 'test board #1',
    size: 16,
    isCTF: false,
    board: [[]],
    visibility: BoardVisibility.Public,
    image: 'random/url/',
    lastUpdatedAt: new Date(),
};

export const VALID_BOARD: Board = {
    name: 'mock_board2',
    description: 'test board #2',
    size: 20,
    isCTF: false,
    board: [[]],
    visibility: BoardVisibility.Public,
    image: 'another/random/url',
    lastUpdatedAt: new Date('2025,01,15'),
};

export const INVALID_BOARD1: Board = {
    name: 'mock_board3',
    description: 'test board #3',
    size: 18,
    isCTF: true,
    board: [[]],
    visibility: BoardVisibility.Public,
    image: 'random/url/',
    lastUpdatedAt: new Date(),
};

export const INVALID_BOARD2: Board = {
    name: 'mock_board4',
    description: 'test board #4',
    size: 16,
    isCTF: true,
    board: [[]],
    visibility: BoardVisibility.Public,
    image: 'url',
    lastUpdatedAt: new Date(),
};

export const MOCK_STORED_BOARD_ARRAY: Board[] = [EMPTY_BOARD, VALID_BOARD, INVALID_BOARD1, INVALID_BOARD2];
