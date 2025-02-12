import { BoardController } from '@app/controllers/board/board.controller';
import { CreateBoardDto } from '@app/model/dto/board/create-board.dto';
import { UpdateBoardDto } from '@app/model/dto/board/update-board-dto';
import { BoardService } from '@app/services/board/board.service';
import { MOCK_STORED_BOARD_ARRAY, UPDATE_BOARD } from '@app/test/helpers/board/stored-board.mock';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { createStubInstance, SinonStubbedInstance } from 'sinon';

describe('BoardController', () => {
    let controller: BoardController;
    let boardService: SinonStubbedInstance<BoardService>;

    beforeEach(async () => {
        boardService = createStubInstance(BoardService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BoardController],
            providers: [
                {
                    provide: BoardService,
                    useValue: boardService,
                },
            ],
        }).compile();

        controller = module.get<BoardController>(BoardController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('allBoards() should return all boards', async () => {
        const fakeBoards = [MOCK_STORED_BOARD_ARRAY[0], MOCK_STORED_BOARD_ARRAY[1]];
        boardService.getAllBoards.resolves(fakeBoards);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (boards) => {
            expect(boards).toEqual(fakeBoards);
            return res;
        };

        await controller.allBoards(res);
    });

    it('allBoards() should return NOT_FOUND when service fails', async () => {
        boardService.getAllBoards.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.allBoards(res);
    });

    it('oneBoard() should return a board', async () => {
        const fakeBoard = UPDATE_BOARD;

        boardService.getBoard.resolves(fakeBoard);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (board) => {
            expect(board).toEqual(fakeBoard);
            return res;
        };

        await controller.oneBoard('Test Board', res);
    });

    it('oneBoard() should return NOT_FOUND if board does not exist', async () => {
        boardService.getBoard.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.oneBoard('Nonexistent Board', res);
    });

    it('addBoard() should succeed if service adds the board', async () => {
        boardService.addBoard.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.CREATED);
            return res;
        };
        res.send = () => res;

        await controller.addBoard({ name: 'New Board' } as CreateBoardDto, res);
    });

    it('addBoard() should return INTERNAL_SERVER_ERROR when service fails', async () => {
        boardService.addBoard.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.send = () => res;
        res.json = () => res;

        await controller.addBoard({ name: 'New Board' } as CreateBoardDto, res);
    });

    it('patchBoard() should update a board successfully', async () => {
        const updatedBoard = MOCK_STORED_BOARD_ARRAY[0];
        boardService.updateBoard.resolves(updatedBoard);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (board) => {
            expect(board).toEqual(updatedBoard);
            return res;
        };

        await controller.patchBoard({ name: 'Updated board' } as UpdateBoardDto, res);
    });

    it('patchBoard() should return INTERNAL_SERVER_ERROR when service fails', async () => {
        boardService.updateBoard.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.send = () => res;
        res.json = () => res;

        await controller.patchBoard({ name: 'Updated Board' } as UpdateBoardDto, res);
    });

    it('toggleBoardVisibility() should toggle board visibility', async () => {
        boardService.toggleVisibility.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.ACCEPTED);
            return res;
        };
        res.send = () => res;

        await controller.toggleBoardVisibility('Test Board', res);
    });

    it('toggleBoardVisibility() should return UNAUTHORIZED when service fails', async () => {
        boardService.toggleVisibility.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.UNAUTHORIZED);
            return res;
        };
        res.send = () => res;

        await controller.toggleBoardVisibility('Test Board', res);
    });

    it('deleteBoardByName() should delete a board', async () => {
        boardService.deleteBoardByName.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NO_CONTENT);
            return res;
        };
        res.send = () => res;

        await controller.deleteBoardByName('Test Board', res);
    });

    it('deleteBoardByName() should return NOT_FOUND when service fails', async () => {
        boardService.deleteBoardByName.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.deleteBoardByName('Nonexistent Board', res);
    });

    it('deleteAllBoards() should delete all boards', async () => {
        boardService.deleteAllBoards.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NO_CONTENT);
            return res;
        };
        res.send = () => res;

        await controller.deleteAllBoards(res);
    });

    it('deleteAllBoards() should return INTERNAL_SERVER_ERROR when service fails', async () => {
        boardService.deleteAllBoards.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.send = () => res;

        await controller.deleteAllBoards(res);
    });
});
