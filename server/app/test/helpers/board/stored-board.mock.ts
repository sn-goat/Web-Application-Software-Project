import { Board } from '@app/model/database/board';
import { Visibility } from '@common/enums';

export const EMPTY_BOARD: Board = {
    name: 'mock_board1',
    description: 'test board #1',
    size: 16,
    isCTF: false,
    board: [[]],
    visibility: Visibility.PUBLIC,
    image: 'random/url/',
    updatedAt: new Date(),
    createdAt: new Date('2023, 02, 02'),
};

export const VALID_BOARD: Board = {
    name: 'mock_board2',
    description: 'test board #2',
    size: 10,
    isCTF: false,
    board: [],
    visibility: Visibility.PUBLIC,
    image: 'another/random/url',
    updatedAt: new Date('2025,01,15'),
    createdAt: new Date('2024, 02, 02'),
};

export const PRIVATE_BOARD: Board = {
    name: 'mock_board3',
    description: 'test board #3',
    size: 10,
    isCTF: true,
    board: [[]],
    visibility: Visibility.PRIVATE,
    image: 'random/url/',
    updatedAt: new Date(),
    createdAt: new Date('2022, 02, 02'),
};

export const INVALID_BOARD2: Board = {
    name: 'mock_board4',
    description: 'test board #4',
    size: 16,
    isCTF: true,
    board: [[]],
    visibility: Visibility.PUBLIC,
    image: 'url',
    updatedAt: new Date(),
    createdAt: new Date('2023, 02, 10'),
};

export const MOCK_STORED_BOARD_ARRAY: Board[] = [EMPTY_BOARD, VALID_BOARD, PRIVATE_BOARD, INVALID_BOARD2];
