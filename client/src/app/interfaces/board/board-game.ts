import { BoardCell } from '@app/interfaces/board/board-cell';

type BoardStatus = 'Ongoing' | 'Completed';
type BoardVisibility = 'Public' | 'Private';

export interface BoardGame {
    _id: string;
    name: string;
    size: number;

    description: string;
    boardCells: BoardCell[][];
    status: BoardStatus;
    visibility: BoardVisibility;
    createdAt?: Date;
    updatedAt?: Date;
}
