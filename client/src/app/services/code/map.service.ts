import { Injectable } from '@angular/core';
import { Board, Validation } from '@common/board';
import { Item, Tile, Visibility, Size } from '@common/enums';
import { BOARD_SIZE_MAPPING } from '@app/constants/map-size-limitd';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    nbrSpawnsToPlace$: Observable<number>;
    nbrItemsToPlace$: Observable<number>;
    hasFlagOnBoard$: Observable<boolean>;

    private readonly storageKey = 'firstBoardValue';

    private firstBoardValue: BehaviorSubject<Board>;
    private boardToSave: BehaviorSubject<Board>;
    private nbrSpawnsToPlace = new BehaviorSubject<number>(0);
    private nbrItemsToPlace = new BehaviorSubject<number>(0);
    private hasFlagOnBoard = new BehaviorSubject<boolean>(false);

    constructor() {
        const savedData = localStorage.getItem(this.storageKey);
        const initialData = savedData ? JSON.parse(savedData) : ({} as Board);
        this.firstBoardValue = new BehaviorSubject<Board>(initialData);

        this.nbrSpawnsToPlace$ = this.nbrSpawnsToPlace.asObservable();
        this.nbrItemsToPlace$ = this.nbrItemsToPlace.asObservable();
        this.initializeBoardData();
    }

    increaseSpawnsToPlace() {
        this.nbrSpawnsToPlace.next(this.nbrSpawnsToPlace.value + 1);
    }

    decreaseSpawnsToPlace() {
        this.nbrSpawnsToPlace.next(this.nbrSpawnsToPlace.value - 1);
    }

    increaseItemsToPlace() {
        this.nbrItemsToPlace.next(this.nbrItemsToPlace.value + 1);
    }

    decreaseItemsToPlace() {
        this.nbrItemsToPlace.next(this.nbrItemsToPlace.value - 1);
    }

    setHasFlagOnBoard(hasFlag: boolean) {
        this.hasFlagOnBoard.next(hasFlag);
    }

    isReadyToSave(): Validation {
        let returnMessage = '';
        if (this.nbrSpawnsToPlace.value > 0) {
            returnMessage += 'Vous devez placer ' + this.nbrSpawnsToPlace.value + " points d'apparition sur la carte\n";
        }
        if (this.nbrItemsToPlace.value > 0) {
            returnMessage += 'Vous devez placer ' + this.nbrItemsToPlace.value + ' objets sur la carte\n';
        }
        if (this.isModeCTF() && !this.hasFlagOnBoard.value) {
            returnMessage += 'Vous devez placer le drapeau sur la carte';
        }
        return { isValid: returnMessage === '', error: returnMessage };
    }

    setMapData(data: Board): void {
        this.firstBoardValue.next(data);
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    getBoardToSave(): BehaviorSubject<Board> {
        return this.boardToSave;
    }

    getFirstBoardValue(): Board {
        return this.firstBoardValue.value;
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

    isModeCTF(): boolean {
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
        const maxMapObject: number = BOARD_SIZE_MAPPING[this.firstBoardValue.value.size as Size];
        this.nbrSpawnsToPlace.next(maxMapObject);
        this.nbrItemsToPlace.next(maxMapObject);
        if (!Array.isArray(data.board) || data.board.length === 0) {
            this.generateBoard();
        } else {
            this.boardToSave = new BehaviorSubject<Board>(data);
            this.parseBoard(this.boardToSave.value);
        }
    }

    private initializeBoardData() {
        this.boardToSave = new BehaviorSubject<Board>({
            name: '',
            description: '',
            size: 0,
            isCTF: false,
            visibility: Visibility.PRIVATE,
            board: [],
            updatedAt: new Date(),
            image: '',
        } as Partial<Board> as Board);
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

    private parseBoard(board: Board) {
        board.board.forEach((row) => {
            row.forEach((cell) => {
                if (cell.item !== Item.DEFAULT) {
                    if (cell.item === Item.SPAWN) {
                        this.decreaseSpawnsToPlace();
                    } else if (cell.item === Item.FLAG) {
                        this.setHasFlagOnBoard(true);
                    } else {
                        this.decreaseItemsToPlace();
                    }
                }
            });
        });
    }
}
