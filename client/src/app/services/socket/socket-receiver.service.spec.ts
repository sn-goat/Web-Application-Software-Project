/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { TestBed } from '@angular/core/testing';
import { FakeSocket } from '@app/helpers/fakeSocket';
import { Tile } from '@common/enums';
import { FightEvents, GameEvents, TurnEvents } from '@common/game.gateway.events';
import { IPlayer } from '@common/player';
import { RoomEvents } from '@common/room.gateway.events';
import { SharedSocketService } from './shared-socket.service';
import { SocketEmitterService } from './socket-emitter.service';
import { SocketReceiverService } from './socket-receiver.service';

describe('SocketReceiverService', () => {
    let service: SocketReceiverService;
    let fakeSocket: FakeSocket;
    let socketEmitterSpy: jasmine.SpyObj<SocketEmitterService>;

    beforeEach(() => {
        fakeSocket = new FakeSocket();
        socketEmitterSpy = jasmine.createSpyObj('SocketEmitterService', ['setAccessCode']);

        TestBed.configureTestingModule({
            providers: [
                SocketReceiverService,
                { provide: SocketEmitterService, useValue: socketEmitterSpy },
                {
                    provide: SharedSocketService,
                    useValue: { socket: fakeSocket },
                },
            ],
        });

        service = TestBed.inject(SocketReceiverService);
    });

    it('should emit room when room is created and call setAccessCode', (done) => {
        const room = { accessCode: 'ROOM123' } as any;
        service.onRoomCreated().subscribe((receivedRoom) => {
            expect(receivedRoom).toEqual(room);
            expect(socketEmitterSpy.setAccessCode).toHaveBeenCalledWith(room.accessCode);
            done();
        });
        fakeSocket.onceCallbacks[RoomEvents.RoomCreated](room);
    });

    it('should emit player joined room', (done) => {
        const room = { id: 'R1' } as any;
        service.onPlayerJoined().subscribe((receivedRoom) => {
            expect(receivedRoom).toEqual(room);
            done();
        });
        fakeSocket.callbacks[RoomEvents.PlayerJoined](room);
    });

    it('should emit join error message', (done) => {
        const message = 'Error joining';
        service.onJoinError().subscribe((msg) => {
            expect(msg).toBe(message);
            done();
        });
        fakeSocket.callbacks[RoomEvents.JoinError](message);
    });

    it('should emit updated players list', (done) => {
        const players = [{ id: 'p1' }, { id: 'p2' }] as any;
        service.onPlayersUpdated().subscribe((received) => {
            expect(received).toEqual(players);
            done();
        });
        fakeSocket.callbacks[RoomEvents.PlayersUpdated](players);
    });

    it('should emit player on character select', (done) => {
        const player = { id: 'p1,' } as IPlayer;
        service.onSetCharacter().subscribe((received) => {
            expect(received).toEqual(player);
            done();
        });
        fakeSocket.callbacks[RoomEvents.SetCharacter](player);
    });

    it('should emit message on player removed', (done) => {
        const message = 'error';
        service.onPlayerRemoved().subscribe((received) => {
            expect(received).toEqual(message);
            done();
        });
        fakeSocket.onceCallbacks[RoomEvents.PlayerRemoved](message);
    });

    it('should emit updated player list on players updated', (done) => {
        const players = [{ id: 'p1,' }, { id: 'p2' }] as IPlayer[];
        service.onPlayersUpdated().subscribe((received) => {
            expect(received).toEqual(players);
            done();
        });
        fakeSocket.callbacks[RoomEvents.PlayersUpdated](players);
    });

    it('should emit on room locked', (done) => {
        service.onRoomLocked().subscribe((received) => {
            expect(received).toBeNull();
            done();
        });
        fakeSocket.callbacks[RoomEvents.RoomLocked](null);
    });

    it('should emit on room unlocked', (done) => {
        service.onRoomUnlocked().subscribe((received) => {
            expect(received).toBeNull();
            done();
        });
        fakeSocket.callbacks[RoomEvents.RoomUnlocked](null);
    });

    it('should emit on game start', (done) => {
        const game = { map: 'TestMap' } as any;
        service.onGameStarted().subscribe((receivedGame) => {
            expect(receivedGame).toEqual(game);
            done();
        });
        fakeSocket.callbacks[GameEvents.GameStarted](game);
    });

    it('should emit an error message on game start error', (done) => {
        const message = 'error';
        service.onGameStartedError().subscribe((received) => {
            expect(received).toEqual(message);
            done();
        });
        fakeSocket.callbacks[GameEvents.Error](message);
    });

    it('should emit on debug mode change', (done) => {
        const isDebug = true;
        service.onDebugModeChanged().subscribe((received) => {
            expect(received).toEqual(isDebug);
            done();
        });
        fakeSocket.callbacks[GameEvents.DebugStateChanged](isDebug);
    });

    it('should emit on game end', (done) => {
        const winner = { id: 'p1' } as IPlayer;
        service.onGameEnded().subscribe((received) => {
            expect(received).toEqual(winner);
            done();
        });
        fakeSocket.onceCallbacks[GameEvents.GameEnded](winner);
    });

    it('should emit on player turn changed with path as Map', (done) => {
        const pathObj = { '1,1': { cost: 1 }, '2,2': { cost: 2 } };
        const player = { id: 'p1' } as IPlayer;
        const data = { player, path: pathObj };

        service.onPlayerTurnChanged().subscribe((received) => {
            expect(received.player).toEqual(player);
            expect(received.path instanceof Map).toBeTrue();
            expect(received.path.get('1,1')?.cost).toEqual(1);
            done();
        });
        fakeSocket.callbacks[TurnEvents.PlayerTurn](data);
    });

    it('should emit on player turn update with path as Map', (done) => {
        const pathObj = { '1,1': { cost: 1 }, '2,2': { cost: 2 } };
        const player = { id: 'p1' } as IPlayer;
        const data = { player, path: pathObj };

        service.onPlayerTurnUpdate().subscribe((received) => {
            expect(received.player).toEqual(player);
            expect(received.path instanceof Map).toBeTrue();
            expect(received.path.get('1,1')?.cost).toEqual(1);
            done();
        });
        fakeSocket.callbacks[TurnEvents.UpdateTurn](data);
    });

    it('should emit on turn start', (done) => {
        service.onTurnStart().subscribe((received) => {
            expect(received).toBeUndefined();
            done();
        });
        fakeSocket.callbacks[TurnEvents.Start](undefined);
    });

    it('should emit on timer update', (done) => {
        const number = 30;
        service.onTimerUpdate().subscribe((received) => {
            expect(received).toEqual(number);
            done();
        });
        fakeSocket.callbacks[TurnEvents.UpdateTimer](number);
    });

    it('should emit on player moved', (done) => {
        const movement = { previousPosition: { x: 1, y: 1 }, player: { id: 'p1' } as IPlayer };
        service.onPlayerMoved().subscribe((received) => {
            expect(received).toEqual(movement);
            done();
        });
        fakeSocket.callbacks[TurnEvents.PlayerMoved](movement);
    });

    it('should emit on door update', (done) => {
        const data = { doorPosition: { x: 1, y: 1 }, newDoorState: Tile.CLOSED_DOOR as Tile.CLOSED_DOOR | Tile.OPENED_DOOR };
        service.onDoorStateChanged().subscribe((received) => {
            expect(received).toEqual(data);
            done();
        });
        fakeSocket.callbacks[TurnEvents.DoorStateChanged](data);
    });

    it('should emit on fight init', (done) => {
        const fight = { id: 'fight1' } as any;
        service.onFightInit().subscribe((received) => {
            expect(received).toEqual(fight);
            done();
        });
        fakeSocket.callbacks[FightEvents.Init](fight);
    });

    it('should emit on fight turn update', (done) => {
        const fight = { id: 'fight1' } as any;
        service.onFighterTurnChanged().subscribe((received) => {
            expect(received).toEqual(fight);
            done();
        });
        fakeSocket.callbacks[FightEvents.ChangeFighter](fight);
    });

    it('should emit fight timer update', (done) => {
        const time = 30;
        service.onFightTimerUpdate().subscribe((received) => {
            expect(received).toEqual(time);
            done();
        });
        fakeSocket.callbacks[FightEvents.UpdateTimer](time);
    });

    it('should emit on end fight', (done) => {
        const result = [{ id: 'winner' }] as any;
        service.onEndFight().subscribe((received) => {
            expect(received).toEqual(result);
            done();
        });
        fakeSocket.callbacks[FightEvents.End](result);
    });

    it('should emit winner data', (done) => {
        const winner = { id: 'win1' } as any;
        service.onWinner().subscribe((received) => {
            expect(received).toEqual(winner);
            done();
        });
        fakeSocket.callbacks[FightEvents.Winner](winner);
    });

    it('should emit loser data', (done) => {
        const loser = { id: 'lose1' } as any;
        service.onLoser().subscribe((received) => {
            expect(received).toEqual(loser);
            done();
        });
        fakeSocket.callbacks[FightEvents.Loser](loser);
    });
});
