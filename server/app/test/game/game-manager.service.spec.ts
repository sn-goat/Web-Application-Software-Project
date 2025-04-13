/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Fight } from '@app/class/fight';
import { Game } from '@app/class/game';
import { Room } from '@app/class/room';
import { Board } from '@app/model/database/board';
import { BoardService } from '@app/services/board/board.service';
import { GameManagerService } from '@app/services/game/games-manager.service';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { Vec2, Cell } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';
import { Avatar } from '@common/game';

const createDummyCell = (pos: Vec2, tile: Tile, player: Avatar = Avatar.Default, item: Item = Item.Default, cost: number = 1): Cell => ({
    position: pos,
    tile,
    item,
    cost,
    player,
});

const dummyBoard: Board = {
    name: 'TestBoard',
    description: 'Dummy board',
    size: 2,
    isCTF: false,
    visibility: Visibility.Public, // adjust according to your Visibility type
    board: [
        [createDummyCell({ x: 0, y: 0 }, Tile.Floor), createDummyCell({ x: 1, y: 0 }, Tile.ClosedDoor)],
        [createDummyCell({ x: 0, y: 1 }, Tile.Ice), createDummyCell({ x: 1, y: 1 }, Tile.Water)],
    ],
    updatedAt: new Date(), // Added to satisfy required property
    createdAt: new Date(),
};

describe('GameManagerService', () => {
    let service: GameManagerService;
    let boardService: jest.Mocked<BoardService>;

    const mockBoard: Board = dummyBoard;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameManagerService,
                {
                    provide: BoardService,
                    useValue: {
                        getBoard: jest.fn().mockResolvedValue(mockBoard),
                    },
                },
                {
                    provide: EventEmitter2,
                    useValue: new EventEmitter2(),
                },
            ],
        }).compile();

        service = module.get<GameManagerService>(GameManagerService);
        boardService = module.get(BoardService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('openRoom', () => {
        it('should create and return a new room', async () => {
            const organizerId = 'organizer123';
            const mapName = 'map1';
            const room = await service.openRoom(organizerId, mapName);

            expect(room).toBeInstanceOf(Room);
            expect(boardService.getBoard).toHaveBeenCalledWith(mapName);

            const retrievedRoom = service.getRoom(room.accessCode);
            expect(retrievedRoom).toEqual(room);
        });

        it('should generate unique access codes', async () => {
            const organizerId = 'org';
            const codes = new Set<string>();

            for (let i = 0; i < 10; i++) {
                const room = await service.openRoom(organizerId + i, 'map');
                expect(codes.has(room.accessCode)).toBeFalsy();
                codes.add(room.accessCode);
            }
        });
    });

    describe('getRoom', () => {
        it('should return a room by access code', async () => {
            const room = await service.openRoom('org1', 'map');
            const fetched = service.getRoom(room.accessCode);
            expect(fetched).toEqual(room);
        });

        it('should return undefined for unknown access code', () => {
            expect(service.getRoom('unknown')).toBeUndefined();
        });
    });

    describe('closeRoom', () => {
        it('should close and delete an existing room', async () => {
            const room = await service.openRoom('org2', 'map');
            const spy = jest.spyOn(room, 'closeRoom');

            service.closeRoom(room.accessCode);

            expect(spy).toHaveBeenCalled();
            expect(service.getRoom(room.accessCode)).toBeUndefined();
        });

        it('should log an error when trying to close a non-existent room', () => {
            const errorSpy = jest.spyOn(Logger.prototype, 'error');

            service.closeRoom('FAKE_CODE');

            expect(errorSpy).toHaveBeenCalledWith('Room with access code FAKE_CODE not found for closing.');
        });
    });

    describe('getGame / getFight', () => {
        it('should return game and fight from room', async () => {
            const room = await service.openRoom('org3', 'map');

            // Mock the game and fight
            const mockGame = { fight: { currentPlayer: { id: 'p1' } } as Fight } as Game;
            Object.defineProperty(room, 'game', {
                value: mockGame,
                writable: true,
            });

            const game = service.getGame(room.accessCode);
            expect(game).toEqual(mockGame);

            const fight = service.getFight(room.accessCode);
            expect(fight).toEqual(mockGame.fight);
        });
    });
});
