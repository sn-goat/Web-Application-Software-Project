import { inject, Injectable } from '@angular/core';
import { Board } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';
import { BehaviorSubject } from 'rxjs';
import { ToolSelectionService } from './tool-selection.service';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    private readonly storageKey = 'firstBoardValue';
    private firstBoardValue: BehaviorSubject<Board>;
    private boardToSave: BehaviorSubject<Board>;
    private readonly toolSelectionService = inject(ToolSelectionService);

    constructor() {
        const savedData = localStorage.getItem(this.storageKey);
        const initialData = savedData ? JSON.parse(savedData) : ({} as Board);
        this.firstBoardValue = new BehaviorSubject<Board>(initialData);
        this.initializeBoardData();
    }

    setMapData(data: Board): void {
        this.firstBoardValue.next(data);
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    getBoardToSave(): BehaviorSubject<Board> {
        return this.boardToSave;
    }

    initializeBoard() {
        this.initializeBoardData();
        if (this.boardToSave.value.board.length === 0) {
            this.generateBoard();
        }
    }

    setBoardName(name: string) {
        const currentBoard = this.boardToSave.value;
        currentBoard.name = name;
        this.boardToSave.next(currentBoard);
    }

    setBoardDescription(description: string): void {
        const currentBoard = this.boardToSave.value;
        currentBoard.description = description;
        this.boardToSave.next(currentBoard);
    }

    getBoardSize(): number {
        const currentBoard = this.boardToSave.value;
        return currentBoard.size;
    }

    getCellTile(col: number, row: number): Tile {
        const currentBoard = this.boardToSave.value;
        return currentBoard.board[row][col].tile;
    }

    getCellItem(col: number, row: number): Item {
        const currentBoard = this.boardToSave.value;
        return currentBoard.board[row][col].item;
    }

    getMode(): boolean {
        const currentBoard = this.boardToSave.value;
        return currentBoard.isCTF;
    }

    setCellTile(col: number, row: number, newTile: Tile) {
        const currentBoard = this.boardToSave.value;
        currentBoard.board[row][col].tile = newTile;
        this.boardToSave.next(currentBoard);
    }

    setCellItem(col: number, row: number, newItem: Item) {
        const currentBoard = this.boardToSave.value;
        currentBoard.board[row][col].item = newItem;
        this.boardToSave.next(currentBoard);
    }

    setBoardToFirstValue() {
        const data: Board = this.firstBoardValue.value;
        if (!Array.isArray(data.board) || data.board.length === 0) {
            this.generateBoard();
        } else {
            this.boardToSave = new BehaviorSubject<Board>(data);
            this.toolSelectionService.parseBoard(this.boardToSave.value);
        }
    }

    private initializeBoardData() {
        this.boardToSave = new BehaviorSubject<Board>({
            _id: '',
            name: '',
            description: '',
            size: 0,
            isCTF: false,
            visibility: Visibility.PRIVATE,
            board: [],
            lastUpdatedAt: new Date(),
            image: '',
        });
    }

    private generateBoard() {
        const boardGame = this.boardToSave.value;
        const data = this.firstBoardValue.value;
        for (let i = 0; i < this.firstBoardValue.value.size; i++) {
            const row = [];
            for (let j = 0; j < this.firstBoardValue.value.size; j++) {
                row.push({ tile: Tile.FLOOR, item: Item.DEFAULT, position: { x: j, y: i } });
            }
            boardGame.board.push(row);
        }
        this.boardToSave = new BehaviorSubject<Board>({
            ...data,
            board: boardGame.board,
        });
    }
}
