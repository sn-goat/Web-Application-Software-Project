import { TestBed } from '@angular/core/testing';

import { MockSocketService } from '@app/helpers/socket-service-mock';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { IGame, IRoom } from '@common/game';
import { IPlayer } from '@common/player';
import { RoomService } from './room.service';

describe('RoomService', () => {
    let service: RoomService;
    let socketServiceMock: MockSocketService;

    const roomMock = {
        accessCode: 'accessCode',
        organizerId: 'p1',
        isLocked: false,
        game: {
            players: [{ id: 'p1' }, { id: 'p2' }] as IPlayer[],
            maxPlayers: 4,
        } as IGame,
    } as IRoom;

    beforeEach(() => {
        socketServiceMock = new MockSocketService();

        TestBed.configureTestingModule({
            providers: [{ provide: SocketReceiverService, useValue: socketServiceMock }],
        });
        service = TestBed.inject(RoomService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize attributes on RoomCreated event', () => {
        socketServiceMock.triggerRoomCreated(roomMock);
        expect(service.connected.value).toBe(roomMock.game.players);
        expect(service.isRoomLocked.value).toBeFalse();
        expect(service.maxPlayer.value).toBe(roomMock.game.maxPlayers);
    });

    it('should update connected and isRoomLocked on PlayerJoined update', () => {
        const updatedPlayers = [...roomMock.game.players, { id: 'p3' } as IPlayer, { id: 'p4' } as IPlayer];
        const updatedGame = { ...roomMock.game, players: updatedPlayers };
        const updatedRoom = { ...roomMock, game: updatedGame, isLocked: true };
        socketServiceMock.triggerPlayerJoined(updatedRoom);
        expect(service.connected.value).toBe(updatedPlayers);
        expect(service.isRoomLocked.value).toBeTrue();
    });

    it('should update connected on playersUpdated event', () => {
        const updatedPlayers = [...roomMock.game.players, { id: 'p3' } as IPlayer];
        socketServiceMock.triggerOnPlayersUpdated(updatedPlayers);
        expect(service.connected.value).toEqual(updatedPlayers);
    });

    it('should lock the room on roomLocked event', () => {
        socketServiceMock.triggerRoomLocked();
        expect(service.isRoomLocked.value).toBeTrue();
    });

    it('should unlock the room on roomUnlocked event', () => {
        socketServiceMock.triggerOnRoomUnlocked();
        expect(service.isRoomLocked.value).toBeFalse();
    });
});
