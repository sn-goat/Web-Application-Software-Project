import { Board, BoardDocument, boardSchema } from '@app/model/database/board';
import { BoardService } from '@app/services/board/board.service';
import { EMPTY_BOARD, PRIVATE_BOARD } from '@app/test/helpers/board/create-board.mock';
import { MOCK_STORED_BOARD_ARRAY, UPDATE_BOARD, VALID_BOARD } from '@app/test/helpers/board/stored-board.mock';
import { createBoard, placeTile, placeUnreachableTile } from '@app/test/helpers/board/tests-utils';
import { Tile, Visibility } from '@common/enums';
import { Logger } from '@nestjs/common';
import { MongooseModule, getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';

describe('BoardService', () => {
    let boardModel: Model<BoardDocument>;
    let service: BoardService;
    let mongoServer: MongoMemoryServer;
    let connection: Connection;
    const SIZE_10 = 10;
    const MOREHALFSIZE = 8;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                MongooseModule.forRootAsync({
                    useFactory: () => ({
                        uri: mongoServer.getUri(),
                    }),
                }),
                MongooseModule.forFeature([{ name: Board.name, schema: boardSchema }]),
            ],
            providers: [BoardService, Logger],
        }).compile();

        boardModel = module.get<Model<BoardDocument>>(getModelToken(Board.name));
        service = module.get<BoardService>(BoardService);
        connection = module.get<Connection>(getConnectionToken());
    });

    beforeEach(async () => {
        await boardModel.deleteMany({});
    });

    afterEach(async () => {
        await boardModel.deleteMany({});
    });

    afterAll(async () => {
        await connection.close();
        await mongoServer.stop();
    });

    it('getAllBoards() should return all boards', async () => {
        if ((await boardModel.countDocuments()) === 0) {
            await boardModel.insertMany(MOCK_STORED_BOARD_ARRAY);
        }
        const boards = await service.getAllBoards();
        expect(boards.length).toEqual(MOCK_STORED_BOARD_ARRAY.length);
    });

    it('getBoard() should return a specific board', async () => {
        if ((await boardModel.countDocuments()) === 0) {
            await boardModel.insertMany(MOCK_STORED_BOARD_ARRAY);
        }
        const board = await service.getBoard(MOCK_STORED_BOARD_ARRAY[0].name);
        expect(board).toMatchObject(MOCK_STORED_BOARD_ARRAY[0]);
    });

    it('addBoard() should add a valid board', async () => {
        const board = createBoard(SIZE_10);
        await service.addBoard({ ...VALID_BOARD, board });
        const boards = await boardModel.find({});
        expect(boards.length).toBe(1);
        expect(boards[0].name).toBe(VALID_BOARD.name);
        expect(boards[0].visibility).toBe(Visibility.Private);
    });

    it('addBoard() should reject an empty board', async () => {
        await expect(service.addBoard(EMPTY_BOARD)).rejects.toEqual('Jeu invalide: Jeu vide');
    });

    it('addBoard() should reject a board with a non-unique name', async () => {
        const board = createBoard(SIZE_10);
        await service.addBoard({ ...VALID_BOARD, board });
        await expect(service.addBoard({ ...VALID_BOARD, board })).rejects.toEqual('Jeu invalide: Nom du jeu doit être unique');
        const boards = await boardModel.find({});
        expect(boards.length).toBe(1);
    });

    it('addBoard() should reject a board with more than half its surface covered by walls', async () => {
        const board = createBoard(SIZE_10);
        for (let i = 0; i < MOREHALFSIZE; i++) {
            for (let j = 0; j < MOREHALFSIZE; j++) {
                placeTile(board, Tile.Wall, { x: i, y: j });
            }
        }
        await expect(service.addBoard({ ...VALID_BOARD, board })).rejects.toEqual(
            'Jeu invalide: Plus de la moitié de la surface du jeu est couverte',
        );
        const boards = await boardModel.find({});
        expect(boards.length).toBe(0);
    });

    it('addBoard() should reject a board with unreachable floor tiles', async () => {
        const board = createBoard(SIZE_10);
        placeUnreachableTile(board, { x: 5, y: 5 });
        await expect(service.addBoard({ ...VALID_BOARD, board })).rejects.toEqual('Jeu invalide: Il y a des tuiles inacessibles');
        const boards = await boardModel.find({});
        expect(boards.length).toBe(0);
    });

    it('addBoard() should reject a board with doors placed on the edge', async () => {
        const board = createBoard(SIZE_10);
        placeTile(board, Tile.ClosedDoor, { x: 9, y: 3 });
        await expect(service.addBoard({ ...VALID_BOARD, board })).rejects.toEqual('Jeu invalide: Des portes sont placées sur les rebords du jeu');
    });

    it('addBoard() should reject a board with an incorrect door structure', async () => {
        const board = createBoard(SIZE_10);
        placeTile(board, Tile.OpenedDoor, { x: 5, y: 5 });
        placeTile(board, Tile.Wall, { x: 6, y: 5 });
        placeTile(board, Tile.Wall, { x: 5, y: 6 });
        await expect(service.addBoard({ ...VALID_BOARD, board })).rejects.toEqual("Jeu invalide: Des portes n'ont pas de structure valide");

        placeTile(board, Tile.Wall, { x: 5, y: 4 });
        placeTile(board, Tile.Ice, { x: 4, y: 5 });
        placeTile(board, Tile.Floor, { x: 6, y: 5 });
        await service.addBoard({ ...VALID_BOARD, board });
        const validBoard = await service.getBoard(VALID_BOARD.name);
        expect(validBoard.board).toEqual(board);
    });

    it('updateBoard() should correcty update a valid board', async () => {
        const boardToStore = createBoard(SIZE_10);
        placeTile(boardToStore, Tile.Wall, { x: 3, y: 3 });
        await service.addBoard({ ...VALID_BOARD, board: boardToStore });

        const updatedBoard = createBoard(SIZE_10);
        placeTile(updatedBoard, Tile.Ice, { x: 3, y: 3 });

        const storedBoard = await service.getBoard(VALID_BOARD.name);
        const updatedBoardObject = { ...storedBoard, _id: storedBoard._id, board: updatedBoard };

        const spyFindOneAndUpdate = jest.spyOn(service['boardModel'], 'findOneAndUpdate');

        await service.updateBoard(updatedBoardObject);

        expect(spyFindOneAndUpdate).toHaveBeenCalled();

        spyFindOneAndUpdate.mockRestore();
    });

    it('updateBoard() should reject an invalid board', async () => {
        const storedBoard = createBoard(SIZE_10);
        await service.addBoard({ ...VALID_BOARD, board: storedBoard });

        const updatedBoard = createBoard(SIZE_10);
        for (let i = 0; i < MOREHALFSIZE; i++) {
            for (let j = 0; j < MOREHALFSIZE; j++) {
                placeTile(updatedBoard, Tile.Wall, { x: i, y: j });
            }
        }

        await expect(service.updateBoard({ ...UPDATE_BOARD, board: updatedBoard })).rejects.toEqual(
            'Jeu invalide: Plus de la moitié de la surface du jeu est couverte',
        );

        const board = await service.getBoard(VALID_BOARD.name);
        expect(board.board).toEqual(storedBoard);
    });

    it('updateBoard() should create a new board if it does not find one', async () => {
        const boardNotFound = createBoard(SIZE_10);
        const boardObject = { ...UPDATE_BOARD, board: boardNotFound };
        const spyFindOneAndUpdate = jest.spyOn(service['boardModel'], 'findOneAndUpdate');

        await service.updateBoard(boardObject);

        expect(spyFindOneAndUpdate).toHaveBeenCalled();

        spyFindOneAndUpdate.mockRestore();
    });

    it('deleteBoardByName() should delete a specific board', async () => {
        if ((await boardModel.countDocuments()) === 0) {
            await boardModel.insertMany(MOCK_STORED_BOARD_ARRAY);
        }
        await service.deleteBoardByName(MOCK_STORED_BOARD_ARRAY[0].name);
        const boards = await boardModel.find({});
        expect(boards.length).toBe(MOCK_STORED_BOARD_ARRAY.length - 1);
    });

    it('deleteBoardByName() should throw an error if board not found', async () => {
        await expect(service.deleteBoardByName('Nonexistent Board')).rejects.toThrow('Board with name "Nonexistent Board" not found.');
    });

    it('deleteAllBoards should delete all boards', async () => {
        await boardModel.insertMany(MOCK_STORED_BOARD_ARRAY);
        await service.deleteAllBoards();
        const boards = await service.getAllBoards();
        expect(boards.length).toEqual(0);
    });

    it('toggleVisibility() should toggle the visibility of a board', async () => {
        const board = createBoard(SIZE_10);
        await service.addBoard({ ...PRIVATE_BOARD, board });
        await service.toggleVisibility(PRIVATE_BOARD.name);
        let boards = await boardModel.find({});
        expect(boards[0].visibility).toBe('Public');
        await service.toggleVisibility(PRIVATE_BOARD.name);
        boards = await boardModel.find({});
        expect(boards[0].visibility).toBe('Private');
    });

    it('toggleVisibility() should throw an error if the name is not found', async () => {
        const board = createBoard(SIZE_10);
        const fakeName = 'FAKE_BOARD_NAME';
        await service.addBoard({ ...PRIVATE_BOARD, board });
        await expect(service.toggleVisibility(fakeName)).rejects.toThrow(`Board with name "${fakeName}" not found.`);
    });
});
