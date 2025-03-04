/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/code/socket.service';
import { Board } from '@common/board';
import { Visibility } from '@common/enums';
import { Socket } from 'socket.io-client';

// Create a mock socket object
class MockSocket {
    on = jasmine.createSpy('on');
    emit = jasmine.createSpy('emit');
    off = jasmine.createSpy('off');
}

// Mock data interfaces
interface GameCreatedData {
    gameId: string;
    accessCode: string;
}

describe('SocketService', () => {
    let service: SocketService;
    let mockSocket: any;

    beforeEach(() => {
        mockSocket = new MockSocket();

        TestBed.configureTestingModule({
            providers: [
                SocketService,
                {
                    provide: Socket,
                    useValue: mockSocket,
                },
            ],
        });
        service = TestBed.inject(SocketService);
        (service as any).socket = mockSocket;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should emit createGame event with organizerId', () => {
        const organizerId = '1234';
        service.createGame(organizerId);
        expect(mockSocket.emit).toHaveBeenCalledWith('createGame', { organizerId });
    });

    it('should emit joinGame event with accessCode and player', () => {
        const accessCode = 'ABCD';
        const player = { id: 'player1', name: 'John Doe' };
        service.joinGame(accessCode, player);
        expect(mockSocket.emit).toHaveBeenCalledWith('joinGame', { accessCode, player });
    });

    it('should emit shareGameMap event with board data', () => {
        const board: Board = {
            _id: '1234',
            name: 'Test Board',
            description: 'Test Description',
            size: 10,
            isCTF: false,
            board: [],
            visibility: Visibility.PRIVATE,
            image: 'test.jpg',
        };

        service.shareGameMap(board);
        expect(mockSocket.emit).toHaveBeenCalledWith('shareGameMap', { board });
    });

    it('should return an observable for gameCreated event', () => {
        const testData: GameCreatedData = { gameId: 'game123', accessCode: 'ABC123' };
        let receivedData: GameCreatedData | undefined;

        mockSocket.on.and.callFake((event: string, callback: (data: unknown) => void): void => {
            if (event === 'gameCreated') {
                callback(testData);
            }
        });

        service.onGameCreated().subscribe((data: unknown) => {
            receivedData = data as GameCreatedData;
        });

        expect(receivedData).toEqual(testData);
        expect(mockSocket.on).toHaveBeenCalledWith('gameCreated', jasmine.any(Function));
    });

    it('should return an observable for playerJoined event', () => {
        const testPlayerData = { playerId: 'player123', name: 'Test Player' };
        let receivedData: any;

        mockSocket.on.and.callFake((event: string, callback: (data: unknown) => void): void => {
            if (event === 'playerJoined') {
                callback(testPlayerData);
            }
        });

        service.onPlayerJoined().subscribe((data: unknown) => {
            receivedData = data;
        });

        expect(receivedData).toEqual(testPlayerData);
        expect(mockSocket.on).toHaveBeenCalledWith('playerJoined', jasmine.any(Function));
    });

    it('should replace the socket when setSocket is called', () => {
        const newMockSocket = new MockSocket();

        service.setSocket(newMockSocket as any);

        const organizerId = 'test123';
        service.createGame(organizerId);

        expect(mockSocket.emit).not.toHaveBeenCalledWith('createGame', { organizerId });
        expect(newMockSocket.emit).toHaveBeenCalledWith('createGame', { organizerId });
    });
});
