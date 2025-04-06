/* eslint-disable @typescript-eslint/ban-types */
import { TestBed } from '@angular/core/testing';
import { SharedSocketService } from './shared-socket.service';
import { SocketEmitterService } from './socket-emitter.service';

import { FakeSocket } from '@app/helpers/fakeSocket';
import { Vec2 } from '@common/board';
import { PathInfo } from '@common/game';
import { FightEvents, GameEvents, TurnEvents } from '@common/game.gateway.events';
import { PlayerInput } from '@common/player';
import { RoomEvents } from '@common/room.gateway.events';

describe('SocketEmitterService', () => {
    let service: SocketEmitterService;
    let fakeSocket: FakeSocket;

    beforeEach(() => {
        fakeSocket = new FakeSocket();

        TestBed.configureTestingModule({
            providers: [
                SocketEmitterService,
                {
                    provide: SharedSocketService,
                    useValue: {
                        socket: fakeSocket,
                    },
                },
            ],
        });

        service = TestBed.inject(SocketEmitterService);
    });

    it('should emit the map name on createRoom', () => {
        const mapName = 'map1';
        service.createRoom(mapName);
        expect(fakeSocket.emit).toHaveBeenCalledWith(RoomEvents.CreateRoom, mapName);
    });

    it('should emit joinRoom with accessCode and set accessCode', () => {
        const accessCode = 'ABC123';
        service.joinRoom(accessCode);
        expect(service.getAccessCode()).toBe(accessCode);
        expect(fakeSocket.emit).toHaveBeenCalledWith(RoomEvents.JoinRoom, accessCode);
    });

    it('should emit shareCharacter with accessCode and player', () => {
        const accessCode = 'CODE';
        const player = { name: 'p1' } as PlayerInput;
        service.setAccessCode(accessCode);
        service.shareCharacter(player);
        expect(fakeSocket.emit).toHaveBeenCalledWith(RoomEvents.ShareCharacter, { accessCode, player });
    });

    it('should emit lockRoom with accessCode', () => {
        const accessCode = 'LOCK123';
        service.setAccessCode(accessCode);
        service.lockRoom();
        expect(fakeSocket.emit).toHaveBeenCalledWith(RoomEvents.LockRoom, accessCode);
    });

    it('should emit unlockRoom with accessCode', () => {
        const accessCode = 'UNLOCK123';
        service.setAccessCode(accessCode);
        service.unlockRoom();
        expect(fakeSocket.emit).toHaveBeenCalledWith(RoomEvents.UnlockRoom, accessCode);
    });

    it('should emit expelPlayer with accessCode and playerId', () => {
        const accessCode = 'EXP123';
        const playerId = 'playerX';
        service.setAccessCode(accessCode);
        service.expelPlayer(playerId);
        expect(fakeSocket.emit).toHaveBeenCalledWith(RoomEvents.ExpelPlayer, { accessCode, playerId });
    });

    it('should emit disconnectPlayer with accessCode and playerId', () => {
        const accessCode = 'DISC456';
        const playerId = 'playerY';
        service.setAccessCode(accessCode);
        service.disconnect(playerId);
        expect(fakeSocket.emit).toHaveBeenCalledWith(RoomEvents.DisconnectPlayer, { accessCode, playerId });
    });

    it('should emit start game with accessCode', () => {
        const accessCode = 'START789';
        service.setAccessCode(accessCode);
        service.startGame();
        expect(fakeSocket.emit).toHaveBeenCalledWith(GameEvents.Start, accessCode);
    });

    it('should emit ready with accessCode and playerId', () => {
        const accessCode = 'READY321';
        const playerId = 'pReady';
        service.setAccessCode(accessCode);
        service.ready(playerId);
        expect(fakeSocket.emit).toHaveBeenCalledWith(GameEvents.Ready, { accessCode, playerId });
    });

    it('should emit debug toggle with accessCode', () => {
        const accessCode = 'DEBUGME';
        service.setAccessCode(accessCode);
        service.toggleDebug();
        expect(fakeSocket.emit).toHaveBeenCalledWith(GameEvents.Debug, accessCode);
    });

    it('should emit movePlayer with accessCode, path, and playerId', () => {
        const accessCode = 'MOVEX';
        const path = { cost: 2 } as PathInfo;
        const playerId = 'playerM';
        service.setAccessCode(accessCode);
        service.movePlayer(path, playerId);
        expect(fakeSocket.emit).toHaveBeenCalledWith(TurnEvents.Move, { accessCode, path, playerId });
    });

    it('should emit debugMove with accessCode, direction, and playerId', () => {
        const accessCode = 'DEBUGMOVE';
        const direction: Vec2 = { x: 1, y: -1 };
        const playerId = 'playerD';
        service.setAccessCode(accessCode);
        service.debugMove(direction, playerId);
        expect(fakeSocket.emit).toHaveBeenCalledWith(TurnEvents.DebugMove, { accessCode, direction, playerId });
    });

    it('should emit endTurn with accessCode', () => {
        const accessCode = 'ENDTURN';
        service.setAccessCode(accessCode);
        service.endTurn();
        expect(fakeSocket.emit).toHaveBeenCalledWith(TurnEvents.End, accessCode);
    });

    it('should emit changeDoorState with accessCode, doorPosition, and playerId', () => {
        const accessCode = 'DOORTEST';
        const doorPosition: Vec2 = { x: 2, y: 3 };
        const playerId = 'doorGuy';
        service.setAccessCode(accessCode);
        service.changeDoorState(doorPosition, playerId);
        expect(fakeSocket.emit).toHaveBeenCalledWith(TurnEvents.ChangeDoorState, { accessCode, doorPosition, playerId });
    });

    it('should emit initFight with accessCode and both player ids', () => {
        const accessCode = 'FIGHTNOW';
        const playerInitiatorId = 'init';
        const playerDefenderId = 'def';
        service.setAccessCode(accessCode);
        service.initFight(playerInitiatorId, playerDefenderId);
        expect(fakeSocket.emit).toHaveBeenCalledWith(FightEvents.Init, { accessCode, playerInitiatorId, playerDefenderId });
    });

    it('should emit flee with accessCode', () => {
        const accessCode = 'RUNAWAY';
        service.setAccessCode(accessCode);
        service.flee();
        expect(fakeSocket.emit).toHaveBeenCalledWith(FightEvents.Flee, accessCode);
    });

    it('should emit attack with accessCode', () => {
        const accessCode = 'ATTACK1';
        service.setAccessCode(accessCode);
        service.attack();
        expect(fakeSocket.emit).toHaveBeenCalledWith(FightEvents.Attack, accessCode);
    });
});
