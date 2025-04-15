/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { TestBed } from '@angular/core/testing';
import { FakeSocket } from '@app/helpers/fake-socket';
import { FightEvents, GameEvents, JournalEvent, StatsEvents, TurnEvents } from '@common/game.gateway.events';
import { Entry, GameMessage } from '@common/journal';
import { IPlayer } from '@common/player';
import { RoomEvents } from '@common/room.gateway.events';
import { mockStandardStats } from '@common/stats';
import { SharedSocketService } from './shared-socket.service';
import { SocketEmitterService } from './socket-emitter.service';
import { SocketReceiverService } from './socket-receiver.service';
import { Cell, Vec2 } from '@common/board';
import { DoorState } from '@common/game';
import { Item, Tile } from '@common/enums';
import { ChatEvents } from '@common/chat.gateway.events';
import { ChatMessage } from '@common/chat';

const generateMockBoard = (size: number): Cell[][] => {
    return Array.from({ length: size }, (_, x) =>
        Array.from(
            { length: size },
            (__, y) =>
                ({
                    position: { x, y } as Vec2,
                    tile: Tile.Wall,
                    item: y % 2 === 0 ? Item.Chest : Item.Default,
                }) as Cell,
        ),
    );
};

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

    it('should emit on journal event', (done) => {
        const mockEntry: Entry = {
            isFight: false,
            message: GameMessage.Quit + 'Jean',
            playersInvolved: ['otherPlayer456'],
        };
        service.onJournalEntry().subscribe((receivedEntry) => {
            expect(receivedEntry).toEqual(mockEntry);
            done();
        });
        fakeSocket.callbacks[JournalEvent.Add](mockEntry);
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

    it('should emit on stats update', (done) => {
        const stats = mockStandardStats;
        service.onStatsUpdate().subscribe((received) => {
            expect(received).toEqual(stats);
            done();
        });
        fakeSocket.callbacks[StatsEvents.StatsUpdate](stats);
    });

    it('should emit on game winner', (done) => {
        const winner = { id: 'winner' } as IPlayer;
        service.onGameWinner().subscribe((received) => {
            expect(received).toEqual(winner);
            done();
        });
        fakeSocket.onceCallbacks[GameEvents.Winner](winner);
    });

    it('should emit on game ended', (done) => {
        service.onGameEnded().subscribe((received) => {
            expect(received).toBeUndefined();
            done();
        });
        fakeSocket.onceCallbacks[GameEvents.GameEnded](undefined);
    });

    it('should update map' + 'with map as Cell[][]', (done) => {
        const map = generateMockBoard(5);
        service.onMapUpdated().subscribe((received) => {
            expect(received).toEqual(map);
            done();
        });
        fakeSocket.callbacks[GameEvents.MapUpdated](map);
    });

    it('should change door state', (done) => {
        const doorState = {
            position: { x: 1, y: 1 } as Vec2,
            state: Tile.OpenedDoor,
        } as DoorState;
        service.onDoorStateChanged().subscribe((received) => {
            expect(received).toEqual(doorState);
            done();
        });
        fakeSocket.callbacks[TurnEvents.DoorStateChanged](doorState);
    });

    it('should collect item', (done) => {
        const item = { player: { id: 'item1' } as IPlayer, position: { x: 0, y: 0 } as Vec2 } as any;
        service.onItemCollected().subscribe((received) => {
            expect(received).toEqual(item);
            done();
        });
        fakeSocket.callbacks[TurnEvents.BroadcastItem](item);
    });

    it('should emit on inventory full', (done) => {
        const item = { player: { id: 'item1' } as IPlayer, item: Item.Default, position: { x: 0, y: 0 } as Vec2 } as any;
        service.onInventoryFull().subscribe((received) => {
            expect(received).toEqual(item);
            done();
        });
        fakeSocket.callbacks[TurnEvents.InventoryFull](item);
    });

    it('should emit on map update', (done) => {
        const item = { player: { id: 'item1' } as IPlayer, item: Item.Default, position: { x: 0, y: 0 } as Vec2 } as any;
        service.onMapUpdate().subscribe((received) => {
            expect(received).toEqual(item);
            done();
        });
        fakeSocket.callbacks[TurnEvents.MapUpdate](item);
    });

    it('should receive message', (done) => {
        const message = { message: 'Hello' } as ChatMessage;
        service.receiveMessageFromServer().subscribe((received) => {
            expect(received).toEqual(message);
            done();
        });
        fakeSocket.callbacks[ChatEvents.RoomMessage](message);
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

    // it('should emit on door update', (done) => {
    //     const data = { doorPosition: { x: 1, y: 1 }, newDoorState: Tile.ClosedDoor as Tile.ClosedDoor | Tile.OpenedDoor };
    //     service.onDoorStateChanged().subscribe((received) => {
    //         expect(received).toEqual(data);
    //         done();
    //     });
    //     fakeSocket.callbacks[TurnEvents.DoorStateChanged](data);
    // });

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
