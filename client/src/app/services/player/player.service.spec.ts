/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { TestBed } from '@angular/core/testing';
import { MockSocketService } from '@app/helpers/socket-service-mock';
import { PlayerService } from '@app/services/player/player.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { PathInfo } from '@common/game';
import { IPlayer } from '@common/player';

describe('PlayerService', () => {
    let service: PlayerService;
    let socketServiceMock: MockSocketService;
    let dummyPlayer: IPlayer;
    let dummyPath: Map<string, PathInfo>;
    let dummyPathInfo: PathInfo;

    beforeEach(() => {
        socketServiceMock = new MockSocketService();

        TestBed.configureTestingModule({
            providers: [
                PlayerService,
                { provide: SocketEmitterService, useValue: socketServiceMock },
                { provide: SocketReceiverService, useValue: socketServiceMock },
            ],
        });
        service = TestBed.inject(PlayerService);

        dummyPlayer = {
            id: 'player1',
            name: 'Player One',
            avatar: 'HeroIcon',
            attackPower: 4,
            defensePower: 4,
            speed: 6,
            life: 4,
            attackDice: 'D4',
            defenseDice: 'D6',
            actions: 1,
            wins: 0,
            movementPts: 6,
            position: { x: 0, y: 0 },
            spawnPosition: { x: 0, y: 0 },
        } as IPlayer;
        dummyPathInfo = {
            /* minimal properties based on PathInfo structure */
        } as PathInfo;
        dummyPath = new Map<string, PathInfo>();
        dummyPath.set('1,1', dummyPathInfo);
        // Ensure service has a player for testing turn events.
        service.setPlayer(dummyPlayer);
    });

    it('should correctly call setPlayer on setCharacter event', () => {
        spyOn(service, 'setPlayer');
        socketServiceMock.triggerSetCharacter({ id: 'testPlayer' } as IPlayer);
        expect(service.setPlayer).toHaveBeenCalledWith({ id: 'testPlayer' } as IPlayer);
    });

    it('should call resetPlayers on PlayerRemoved event', () => {
        spyOn(service, 'resetPlayers');
        socketServiceMock.triggerPlayerRemoved();
        expect(service.resetPlayers).toHaveBeenCalled();
    });

    it('should set the path and player state if this is the client', () => {
        spyOn(service, 'setPath');
        spyOn(service, 'setPlayer');
        socketServiceMock.triggerPlayerTurnChanged({ player: dummyPlayer, path: dummyPath });
        expect(service.setPath).toHaveBeenCalledWith(dummyPath);
        expect(service.setPlayer).toHaveBeenCalledWith(dummyPlayer);
    });

    it('should not set the path and player state if this is not the client', () => {
        spyOn(service, 'setPlayerActive');
        spyOn(service, 'setPlayer');
        socketServiceMock.triggerPlayerTurnChanged({ player: { id: 'not-current-player' } as IPlayer, path: dummyPath });
        expect(service.setPlayerActive).toHaveBeenCalledWith(false);
    });

    it('should setPlayerActive to true when the turm starts', () => {
        socketServiceMock.triggerStartTurn();
        expect(service.isActivePlayer.value).toBeTrue();
    });

    it('should update player and path on turn update', () => {
        const updatedPlayer: IPlayer = { ...service.getPlayer(), spawnPosition: { x: 2, y: 2 }, position: { x: 2, y: 2 } };
        const newPath = new Map<string, PathInfo>();
        newPath.set('2,2', dummyPathInfo);
        socketServiceMock.triggerTurnUpdate({ player: updatedPlayer, path: newPath });
        expect(service.getPlayer()).toEqual(updatedPlayer);
        expect(service.path.value).toEqual(newPath);
        expect(service.isActive()).toBe(true);
    });

    it('should send move if path exists for given position', () => {
        // Setup path so that the key for position {x:1, y:1} exists.
        const movePath = new Map<string, PathInfo>();
        movePath.set('1,1', dummyPathInfo);
        service.setPath(movePath);

        spyOn(socketServiceMock, 'movePlayer');

        // Call sendMove with the position corresponding to key "1,1".
        service.sendMove({ x: 1, y: 1 });
        expect(service.isActive()).toBe(false);
        expect(socketServiceMock.movePlayer).toHaveBeenCalledWith(jasmine.any(Object), dummyPlayer.id);
    });

    it('should not send move if no path exists for given position', () => {
        // Clear any existing path
        service.setPath(new Map());

        spyOn(socketServiceMock, 'movePlayer');

        service.sendMove({ x: 5, y: 5 });
        expect(socketServiceMock.movePlayer).not.toHaveBeenCalled();
    });

    it('should correctly get and set admin status', () => {
        service.setAdmin(true);
        expect(service.isPlayerAdmin()).toBe(true);
        service.setAdmin(false);
        expect(service.isPlayerAdmin()).toBe(false);
    });
});
