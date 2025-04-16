import { Board } from '@app/model/database/board';
import { UpdateBoardDto } from '@app/model/dto/board/update-board-dto';
import { Visibility } from '@common/enums';

export const EMPTY_BOARD: Board = {
    name: 'mock_board1',
    description: 'test board #1',
    size: 16,
    isCTF: false,
    board: [[]],
    visibility: Visibility.Public,
    updatedAt: new Date(),
    createdAt: new Date('2023, 02, 02'),
};

export const VALID_BOARD: Board = {
    name: 'mock_board2',
    description: 'test board #2',
    size: 10,
    isCTF: false,
    board: [],
    visibility: Visibility.Public,
    updatedAt: new Date('2025,01,15'),
    createdAt: new Date('2024, 02, 02'),
};

export const PRIVATE_BOARD: Board = {
    name: 'mock_board3',
    description: 'test board #3',
    size: 10,
    isCTF: true,
    board: [[]],
    visibility: Visibility.Private,
    updatedAt: new Date(),
    createdAt: new Date('2022, 02, 02'),
};

export const INVALID_BOARD2: Board = {
    name: 'mock_board4',
    description: 'test board #4',
    size: 16,
    isCTF: true,
    board: [[]],
    visibility: Visibility.Public,
    updatedAt: new Date(),
    createdAt: new Date('2023, 02, 10'),
};

export const UPDATE_BOARD: UpdateBoardDto = {
    _id: '67a929a38ebc390a54b83bae',
    name: 'mock_board2',
    description: 'test board #2',
    size: 10,
    isCTF: false,
    board: [],
    visibility: Visibility.Public,
    updatedAt: new Date('2025,01,15'),
    createdAt: new Date('2024, 02, 02'),
};

export const MOCK_STORED_BOARD_ARRAY: Board[] = [EMPTY_BOARD, VALID_BOARD, PRIVATE_BOARD, INVALID_BOARD2];
