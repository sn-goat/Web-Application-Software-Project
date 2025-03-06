/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { GameMapService } from '@app/services/code/game-map.service';
import { SocketService } from '@app/services/code/socket.service';
import { Board } from '@common/board';

describe('GameMapService', () => {
    let service: GameMapService;
    let mockSocketService: any;

    beforeEach(() => {
        mockSocketService = {
            shareGameMap: jasmine.createSpy('shareGameMap'),
        };

        TestBed.configureTestingModule({
            providers: [GameMapService, { provide: SocketService, useValue: mockSocketService }],
        });
        service = TestBed.inject(GameMapService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call socketService.shareGameMap with the current board when shareGameMap is invoked', () => {
        const currentBoard: Board = service.getGameMap().value;
        service.shareGameMap();
        expect(mockSocketService.shareGameMap).toHaveBeenCalledWith(currentBoard);
    });
});
