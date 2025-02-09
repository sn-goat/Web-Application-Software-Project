import { Board, BoardDocument, boardSchema } from '@app/model/database/board';
import { BoardService } from '@app/services/board/board.service';
import { EMPTY_BOARD, PRIVATE_BOARD } from '@app/test/helpers/board/create-board.mock';
import { MOCK_STORED_BOARD_ARRAY, VALID_BOARD } from '@app/test/helpers/board/stored-board.mock';
import { createBoard, placeTile, placeUnreachableTile } from '@app/test/helpers/board/tests-utils';
import { Tile, Visibility } from '@common/enums';
import { Logger } from '@nestjs/common';
import { MongooseModule, getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';

describe('BoardServicePopulate', () => {
    let service: BoardService;
    let boardModel: Model<BoardDocument>;

    beforeEach(async () => {
        // notice that only the functions we call from the model are mocked
        // we can´t use sinon because mongoose Model is an interface
        boardModel = {
            countDocuments: jest.fn(),
            insertMany: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            deleteOne: jest.fn(),
            update: jest.fn(),
            updateOne: jest.fn(),
        } as unknown as Model<BoardDocument>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BoardService,
                Logger,
                {
                    provide: getModelToken(Board.name),
                    useValue: boardModel,
                },
            ],
        }).compile();

        service = module.get<BoardService>(BoardService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('database should be populated when there is no data', async () => {
        jest.spyOn(boardModel, 'countDocuments').mockResolvedValue(0);
        const spyPopulateDB = jest.spyOn(service, 'populateDB');
        await service.start();
        expect(spyPopulateDB).toHaveBeenCalled();
    });

    it('database should not be populated when there is some data', async () => {
        jest.spyOn(boardModel, 'countDocuments').mockResolvedValue(1);
        const spyPopulateDB = jest.spyOn(service, 'populateDB');
        await service.start();
        expect(spyPopulateDB).not.toHaveBeenCalled();
    });
});

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

        /* 
           Delay here to ensure that our database is properly initialized,
           as the start function is asynchronous but cannot be awaited since it's 
           in the constructor. 
        */
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        await new Promise((resolve) => setTimeout(resolve, 200));
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
        await service.populateDB();
        const boards = await service.getAllBoards();
        expect(boards.length).toEqual(MOCK_STORED_BOARD_ARRAY.length);
    });

    it('getBoard() should return a specific board', async () => {
        await service.populateDB();
        const board = await service.getBoard(MOCK_STORED_BOARD_ARRAY[0].name);
        expect(board).toMatchObject(MOCK_STORED_BOARD_ARRAY[0]);
    });

    it('addBoard() should add a valid board', async () => {
        const board = createBoard(SIZE_10);
        await service.addBoard({ ...VALID_BOARD, board });
        const boards = await boardModel.find({});
        expect(boards.length).toBe(1);
        expect(boards[0].name).toBe(VALID_BOARD.name);
        expect(boards[0].visibility).toBe(Visibility.PRIVATE);
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
                placeTile(board, Tile.WALL, { x: i, y: j });
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
        placeTile(board, Tile.CLOSED_DOOR, { x: 9, y: 3 });
        await expect(service.addBoard({ ...VALID_BOARD, board })).rejects.toEqual('Jeu invalide: Des portes sont placées sur les rebords du jeu');
    });

    it('addBoard() should reject a board with an incorrect door structure', async () => {
        const board = createBoard(SIZE_10);
        placeTile(board, Tile.OPENED_DOOR, { x: 5, y: 5 });
        placeTile(board, Tile.WALL, { x: 6, y: 5 });
        placeTile(board, Tile.WALL, { x: 5, y: 6 });
        await expect(service.addBoard({ ...VALID_BOARD, board })).rejects.toEqual("Jeu invalide: Des portes n'ont pas de structure valide");
    });

    it('updateBoard() should correcty update a valid board', async () => {
        const storedBoard = createBoard(SIZE_10);
        placeTile(storedBoard, Tile.WALL, { x: 3, y: 3 });
        await service.addBoard({ ...VALID_BOARD, board: storedBoard });
        const updatedBoard = createBoard(SIZE_10);
        placeTile(updatedBoard, Tile.ICE, { x: 3, y: 3 });
        await service.updateBoard({ ...VALID_BOARD, board: updatedBoard, visibility: Visibility.PRIVATE });
        const board = await service.getBoard(VALID_BOARD.name);
        expect(board.board[3][3].tile).toEqual(Tile.ICE);
        expect(board.visibility).toEqual(Visibility.PRIVATE);
    });

    it('updateBoard() should reject an invalid board', async () => {
        const storedBoard = createBoard(SIZE_10);
        await service.addBoard({ ...VALID_BOARD, board: storedBoard });

        const updatedBoard = createBoard(SIZE_10);
        for (let i = 0; i < MOREHALFSIZE; i++) {
            for (let j = 0; j < MOREHALFSIZE; j++) {
                placeTile(updatedBoard, Tile.WALL, { x: i, y: j });
            }
        }

        await expect(service.updateBoard({ ...VALID_BOARD, board: updatedBoard })).rejects.toEqual(
            'Jeu invalide: Plus de la moitié de la surface du jeu est couverte',
        );

        const board = await service.getBoard(VALID_BOARD.name);
        expect(board.board).toEqual(storedBoard);
    });

    it('updateBoard() should create a new board if it does not find one', async () => {
        const boardNotFound = createBoard(SIZE_10);
        await service.addBoard({ ...VALID_BOARD, board: boardNotFound });
        const board = await service.getBoard(VALID_BOARD.name);
        expect(board.board).toMatchObject(boardNotFound);
    });

    it('deleteBoardByName() should delete a specific board', async () => {
        await service.populateDB();
        await service.deleteBoardByName(MOCK_STORED_BOARD_ARRAY[0].name);
        const boards = await boardModel.find({});
        expect(boards.length).toBe(MOCK_STORED_BOARD_ARRAY.length - 1);
    });

    it('deleteBoardByName() should throw an error if board not found', async () => {
        await expect(service.deleteBoardByName('Nonexistent Board')).rejects.toThrow('Board with name "Nonexistent Board" not found.');
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
