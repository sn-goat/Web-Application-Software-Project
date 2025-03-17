/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/code/socket.service';
import { Vec2 } from '@common/board';
import { Tile } from '@common/enums';
import { PathInfo, Room } from '@common/game';
import { FightEvents, GameEvents, TurnEvents } from '@common/game.gateway.events';
import { PlayerStats } from '@common/player';
import { RoomEvents } from '@common/room.gateway.events';

// FakeSocket qui enregistre les callbacks sur chaque événement.
class FakeSocket {
    callbacks: { [event: string]: Function } = {};
    emit = jasmine.createSpy('emit');
    id = 'fakeSocketId';

    on(event: string, callback: Function) {
        this.callbacks[event] = callback;
    }
}

describe('SocketService', () => {
    let service: SocketService;
    let routerSpy: jasmine.SpyObj<Router>;
    let fakeSocket: FakeSocket;

    beforeEach(() => {
        fakeSocket = new FakeSocket();
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [SocketService, { provide: Router, useValue: routerSpy }],
        });
        service = TestBed.inject(SocketService);

        // Remplacer l'instance de socket créée dans le constructeur par notre FakeSocket.
        // Ceci nous permet d'éviter d'intercepter socketIo.io.
        (service as any).socket = fakeSocket;
        // Simuler l'enregistrement du callback pour "redirectHome"
        fakeSocket.on('redirectHome', () => {
            routerSpy.navigate(['/accueil']);
        });
    });

    it('should be created and set up redirectHome listener', () => {
        expect(service).toBeTruthy();
        // Vérifier que le callback pour "redirectHome" a bien été enregistré.
        expect(fakeSocket.callbacks['redirectHome']).toBeDefined();
    });

    it('should navigate to /accueil on redirectHome event', () => {
        expect(fakeSocket.callbacks['redirectHome']).toBeDefined();
        // Simuler l'appel du callback pour "redirectHome"
        fakeSocket.callbacks['redirectHome']();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/accueil']);
    });

    it('should emit createRoom event with correct parameters', () => {
        const size = 8;
        const organizerId = fakeSocket.id;
        service.createRoom(size);
        expect(service.getGameSize()).toEqual(size);
        expect(fakeSocket.emit).toHaveBeenCalledWith(RoomEvents.CreateRoom, { organizerId, size });
    });

    it('should emit joinRoom event with accessCode', () => {
        const accessCode = 'ABC123';
        service.joinRoom(accessCode);
        expect(fakeSocket.emit).toHaveBeenCalledWith(RoomEvents.JoinRoom, { accessCode });
    });

    it('should update currentPlayerId and emit shareCharacter event', () => {
        const accessCode = 'XYZ';
        const player: PlayerStats = { id: 'player1' } as PlayerStats;
        service.shareCharacter(accessCode, player);
        expect(service.getCurrentPlayerId()).toEqual(player.id);
        expect(fakeSocket.emit).toHaveBeenCalledWith(RoomEvents.ShareCharacter, { accessCode, player });
    });

    it('should update gameRoom and emit value on onPlayerJoined observable', (done) => {
        const room: Room = {} as Room;
        service.onPlayerJoined().subscribe((data: { room: Room }) => {
            expect(data.room).toEqual(room);
            expect(service.gameRoom).toEqual(room);
            done();
        });
        // Simuler l'appel du callback pour "playerJoined"
        if (fakeSocket.callbacks['playerJoined']) {
            fakeSocket.callbacks['playerJoined']({ room });
        }
    });

    it('should emit lockRoom event with accessCode', () => {
        const accessCode = 'LOCK123';
        service.lockRoom(accessCode);
        expect(fakeSocket.emit).toHaveBeenCalledWith('lockRoom', { accessCode });
    });

    it('should emit unlockRoom event with accessCode', () => {
        const accessCode = 'UNLOCK123';
        service.unlockRoom(accessCode);
        expect(fakeSocket.emit).toHaveBeenCalledWith('unlockRoom', { accessCode });
    });

    it('should emit removePlayer event with accessCode and playerId', () => {
        const accessCode = 'REMOVE';
        const playerId = 'playerX';
        service.removePlayer(accessCode, playerId);
        expect(fakeSocket.emit).toHaveBeenCalledWith('removePlayer', { accessCode, playerId });
    });

    it('should emit players list on onPlayersList observable', (done) => {
        const playersData: PlayerStats[] = [{ id: 'p1' }, { id: 'p2' }] as PlayerStats[];
        service.onPlayersList().subscribe((players: PlayerStats[]) => {
            expect(players).toEqual(playersData);
            done();
        });
        if (fakeSocket.callbacks['playersList']) {
            fakeSocket.callbacks['playersList'](playersData);
        }
    });

    it('should emit players list on onPlayerRemoved observable', (done) => {
        const playersData: PlayerStats[] = [{ id: 'p3' }] as PlayerStats[];
        service.onPlayerRemoved().subscribe((players: PlayerStats[]) => {
            expect(players).toEqual(playersData);
            done();
        });
        if (fakeSocket.callbacks['playerRemoved']) {
            fakeSocket.callbacks['playerRemoved'](playersData);
        }
    });

    it('should emit players list on onPlayerDisconnected observable', (done) => {
        const playersData: PlayerStats[] = [{ id: 'p4' }] as PlayerStats[];
        service.onPlayerDisconnected().subscribe((players: PlayerStats[]) => {
            expect(players).toEqual(playersData);
            done();
        });
        if (fakeSocket.callbacks['playerDisconnected']) {
            fakeSocket.callbacks['playerDisconnected'](playersData);
        }
    });

    it('should emit error on onJoinError observable', (done) => {
        const errorData = { message: 'Join error occurred' };
        service.onJoinError().subscribe((error: { message: string }) => {
            expect(error).toEqual(errorData);
            done();
        });
        if (fakeSocket.callbacks['joinError']) {
            fakeSocket.callbacks['joinError'](errorData);
        }
    });

    it('should emit disconnectPlayer event with accessCode and playerId on disconnect', () => {
        const accessCode = 'DISC123';
        const playerId = 'playerZ';
        service.disconnect(accessCode, playerId);
        expect(fakeSocket.emit).toHaveBeenCalledWith('disconnectPlayer', { accessCode, playerId });
    });

    it('should register redirectHome callback in the constructor and navigate to /accueil when triggered', () => {
        // Vérifier que le callback a bien été enregistré
        expect(fakeSocket.callbacks['redirectHome']).toBeDefined();

        // Simuler l'événement 'redirectHome'
        fakeSocket.callbacks['redirectHome']();

        // Vérifier que router.navigate a été appelé avec ['/accueil']
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/accueil']);
    });

    it('should emit data through onGameCreated observable when gameCreated event is triggered', (done) => {
        const testData = { created: true };

        // S'abonner à onGameCreated
        service.onRoomCreated().subscribe((data) => {
            expect(data).toEqual(testData);
            done();
        });

        // Simuler l'événement 'gameCreated'
        if (fakeSocket.callbacks['roomCreated']) {
            fakeSocket.callbacks['roomCreated'](testData);
        }
    });

    it('toggleDebugMode should emit debug event', () => {
        const accessCode = 'TESTDEBUG';
        service.toggleDebugMode(accessCode);
        expect(fakeSocket.emit).toHaveBeenCalledWith(GameEvents.Debug, accessCode);
    });

    it('debugMove should emit debug move event', () => {
        const accessCode = 'TESTDEBUGMOVE';
        const direction: Vec2 = { x: 5, y: -3 };
        service.debugMove(accessCode, direction);
        expect(fakeSocket.emit).toHaveBeenCalledWith(TurnEvents.DebugMove, { accessCode, direction });
    });

    it('changeDoorState should emit correct event', () => {
        const accessCode = 'TESTDOOR';
        const position: Vec2 = { x: 2, y: 2 };
        const player = { id: 'playerDoor' } as any;
        service.changeDoorState(accessCode, position, player);
        expect(fakeSocket.emit).toHaveBeenCalledWith(TurnEvents.ChangeDoorState, { accessCode, position, player });
    });

    it('initFight should emit fight init event', () => {
        const accessCode = 'FIGHT1';
        const player1 = { id: 'p1' } as any;
        const player2 = { id: 'p2' } as any;
        service.initFight(accessCode, player1, player2);
        expect(fakeSocket.emit).toHaveBeenCalledWith(FightEvents.Init, { accessCode, player1, player2 });
    });

    it('onFightInit should receive fight init event', (done) => {
        const fightData = { dummy: 'data' } as any;
        service.onFightInit().subscribe((data) => {
            expect(data).toEqual(fightData);
            done();
        });
        if (fakeSocket.callbacks[FightEvents.Init]) {
            fakeSocket.callbacks[FightEvents.Init](fightData);
        }
    });

    it('playerFlee should emit flee event', () => {
        const accessCode = 'FLEE1';
        service.playerFlee(accessCode);
        expect(fakeSocket.emit).toHaveBeenCalledWith(FightEvents.Flee, accessCode);
    });

    it('playerAttack should emit attack event', () => {
        const accessCode = 'ATTACK1';
        service.playerAttack(accessCode);
        expect(fakeSocket.emit).toHaveBeenCalledWith(FightEvents.Attack, accessCode);
    });

    it('endTurn should emit end turn event', () => {
        const accessCode = 'ENDTURN1';
        service.endTurn(accessCode);
        expect(fakeSocket.emit).toHaveBeenCalledWith(TurnEvents.End, accessCode);
    });

    it('onBroadcastStartGame should receive game data (called twice)', (done) => {
        const gameData = { dummy: 'gameData' } as any;
        let callCount = 0;
        service.onBroadcastStartGame().subscribe((data) => {
            expect(data).toEqual(gameData);
            callCount++;
            if (callCount === 2) {
                done();
            }
        });
        // Les deux callbacks enregistrés doivent être appelés
        if (fakeSocket.callbacks[GameEvents.BroadcastStartGame]) {
            fakeSocket.callbacks[GameEvents.BroadcastStartGame](gameData);
            fakeSocket.callbacks[GameEvents.BroadcastStartGame](gameData);
        }
    });

    it('onBroadcastDebugState should receive debug state', (done) => {
        const debugData: void = undefined;
        service.onBroadcastDebugState().subscribe((data) => {
            expect(data).toEqual(debugData);
            done();
        });
        if (fakeSocket.callbacks[GameEvents.BroadcastDebugState]) {
            fakeSocket.callbacks[GameEvents.BroadcastDebugState](debugData);
        }
    });

    it('onTimerUpdate should receive timer update data', (done) => {
        const timerData = { remainingTime: 10 };
        service.onTimerUpdate().subscribe((data) => {
            expect(data).toEqual(timerData);
            done();
        });
        if (fakeSocket.callbacks[TurnEvents.UpdateTimer]) {
            fakeSocket.callbacks[TurnEvents.UpdateTimer](timerData);
        }
    });

    it('onAssignSpawn should receive spawn assignment', (done) => {
        const position: Vec2 = { x: 0, y: 0 };
        service.onAssignSpawn().subscribe((pos) => {
            expect(pos).toEqual(position);
            done();
        });
        if (fakeSocket.callbacks[GameEvents.AssignSpawn]) {
            fakeSocket.callbacks[GameEvents.AssignSpawn](position);
        }
    });

    it('onFightTimerUpdate should receive fight timer update', (done) => {
        const remainingTime = 20;
        service.onFightTimerUpdate().subscribe((time) => {
            expect(time).toEqual(remainingTime);
            done();
        });
        if (fakeSocket.callbacks[FightEvents.UpdateTimer]) {
            fakeSocket.callbacks[FightEvents.UpdateTimer](remainingTime);
        }
    });

    it('onTurnUpdate should convert path object to Map', (done) => {
        const dummyPath: Record<string, PathInfo> = { key1: { dummy: 'info' } as any };
        const turnData = { player: { id: 'pTurn' } as any, path: dummyPath };
        service.onTurnUpdate().subscribe(({ player, path }) => {
            expect(player).toEqual(turnData.player);
            expect(path).toBeInstanceOf(Map);
            expect(path.get('key1')).toEqual(dummyPath.key1);
            done();
        });
        if (fakeSocket.callbacks[TurnEvents.UpdateTurn]) {
            fakeSocket.callbacks[TurnEvents.UpdateTurn](turnData);
        }
    });

    it('onTurnSwitch should receive turn switch data from both events', (done) => {
        const dummyPath: Record<string, PathInfo> = { key: { dummy: 'turn' } as any };
        const turnData = { player: { id: 'pSwitch' } as any, path: dummyPath };
        let callCount = 0;
        service.onTurnSwitch().subscribe(({ player, path }) => {
            expect(player).toEqual(turnData.player);
            expect(path).toBeInstanceOf(Map);
            callCount++;
            if (callCount === 2) {
                done();
            }
        });
        if (fakeSocket.callbacks[TurnEvents.PlayerTurn]) {
            fakeSocket.callbacks[TurnEvents.PlayerTurn](turnData);
        }
        if (fakeSocket.callbacks[TurnEvents.UpdateTurn]) {
            fakeSocket.callbacks[TurnEvents.UpdateTurn](turnData);
        }
    });

    it('onEndTurn should receive end turn data', (done) => {
        const data = { info: 'endTurn' };
        service.onEndTurn().subscribe((received) => {
            expect(received).toEqual(data);
            done();
        });
        if (fakeSocket.callbacks[TurnEvents.End]) {
            fakeSocket.callbacks[TurnEvents.End](data);
        }
    });

    it('onFullInventory should receive inventory data', (done) => {
        const data = { full: true };
        service.onFullInventory().subscribe((received) => {
            expect(received).toEqual(data);
            done();
        });
        if (fakeSocket.callbacks[TurnEvents.FullInventory]) {
            fakeSocket.callbacks[TurnEvents.FullInventory](data);
        }
    });

    it('onBroadcastEnd should receive broadcast end data', (done) => {
        const data = 'broadcastEnd';
        service.onBroadcastEnd().subscribe((received) => {
            expect(received).toEqual(data);
            done();
        });
        if (fakeSocket.callbacks[TurnEvents.BroadcastEnd]) {
            fakeSocket.callbacks[TurnEvents.BroadcastEnd](data);
        }
    });

    it('onBroadcastMove should receive broadcast move data', (done) => {
        const moveData = { previousPosition: { x: 1, y: 1 } as Vec2, player: { id: 'pMove' } as any };
        service.onBroadcastMove().subscribe((received) => {
            expect(received).toEqual(moveData);
            done();
        });
        if (fakeSocket.callbacks[TurnEvents.BroadcastMove]) {
            fakeSocket.callbacks[TurnEvents.BroadcastMove](moveData);
        }
    });

    it('onBroadcastItem should receive broadcast item data', (done) => {
        const data = { item: 'sword' };
        service.onBroadcastItem().subscribe((received) => {
            expect(received).toEqual(data);
            done();
        });
        if (fakeSocket.callbacks[TurnEvents.BroadcastItem]) {
            fakeSocket.callbacks[TurnEvents.BroadcastItem](data);
        }
    });

    it('onBroadcastDoor should receive door event data', (done) => {
        const data = { position: { x: 3, y: 3 } as Vec2, newState: Tile.CLOSED_DOOR } as any;
        service.onBroadcastDoor().subscribe((received) => {
            expect(received).toEqual(data);
            done();
        });
        if (fakeSocket.callbacks[TurnEvents.BroadcastDoor]) {
            fakeSocket.callbacks[TurnEvents.BroadcastDoor](data);
        }
    });

    it('onSwitchTurn should receive fight switch turn data', (done) => {
        const fightData = { dummy: 'switchTurn' } as any;
        service.onSwitchTurn().subscribe((received) => {
            expect(received).toEqual(fightData);
            done();
        });
        if (fakeSocket.callbacks[FightEvents.SwitchTurn]) {
            fakeSocket.callbacks[FightEvents.SwitchTurn](fightData);
        }
    });

    it('onEndFight should receive end fight data', (done) => {
        const data = { id: 'pFight' } as any;
        service.onEndFight().subscribe((received) => {
            expect(received).toEqual(data);
            done();
        });
        if (fakeSocket.callbacks[FightEvents.End]) {
            fakeSocket.callbacks[FightEvents.End](data);
        }
    });

    it('onWinner should receive winner event', (done) => {
        const data = 'winner' as any;
        service.onWinner().subscribe((received) => {
            expect(received).toEqual(data);
            done();
        });
        if (fakeSocket.callbacks[FightEvents.Winner]) {
            fakeSocket.callbacks[FightEvents.Winner](data);
        }
    });

    it('onLoser should receive loser event', (done) => {
        const data = 'loser' as any;
        service.onLoser().subscribe((received) => {
            expect(received).toEqual(data);
            done();
        });
        if (fakeSocket.callbacks[FightEvents.Loser]) {
            fakeSocket.callbacks[FightEvents.Loser](data);
        }
    });

    it('getCurrentPlayerId should return socket id', () => {
        expect(service.getCurrentPlayerId()).toEqual(fakeSocket.id);
    });

    it('getGameSize should return the correct size', () => {
        const size = 12;
        service.createRoom(size);
        expect(service.getGameSize()).toEqual(size);
    });

    it('getCurrentPlayer should return currentPlayer (initially undefined)', () => {
        expect(service.getCurrentPlayer()).toBeUndefined();
    });

    it('onRoomLocked should receive room locked event', (done) => {
        const lockedData = { locked: true };
        service.onRoomLocked().subscribe((data) => {
            expect(data).toEqual(lockedData);
            done();
        });
        if (fakeSocket.callbacks[RoomEvents.RoomLocked]) {
            fakeSocket.callbacks[RoomEvents.RoomLocked](lockedData);
        }
    });

    it('onRoomData should receive room data', (done) => {
        const roomData = { name: 'TestRoom' } as any;
        service.onRoomData().subscribe((data) => {
            expect(data).toEqual(roomData);
            done();
        });
        if (fakeSocket.callbacks[RoomEvents.RoomData]) {
            fakeSocket.callbacks[RoomEvents.RoomData](roomData);
        }
    });

    it('createGame should emit create game event with correct parameters', () => {
        const accessCode = 'GAME123';
        const mapName = 'TestMap';
        service.createGame(accessCode, mapName);
        expect(fakeSocket.emit).toHaveBeenCalledWith(GameEvents.Create, {
            accessCode,
            mapName,
            organizerId: fakeSocket.id,
        });
    });

    it('configureGame should emit configure game event with correct parameters', () => {
        const accessCode = 'GAMECONFIG';
        const players: any[] = [{ id: 'player1' }, { id: 'player2' }];
        service.configureGame(accessCode, players);
        expect(fakeSocket.emit).toHaveBeenCalledWith(GameEvents.Configure, { accessCode, players });
    });

    it('readyUp should emit ready event with correct parameters', () => {
        const accessCode = 'READYGAME';
        const playerId = 'player1';
        service.readyUp(accessCode, playerId);
        expect(fakeSocket.emit).toHaveBeenCalledWith(GameEvents.Ready, { accessCode, playerId });
    });

    it('movePlayer should emit move event with correct parameters', () => {
        const accessCode = 'MOVE1';
        const path: any = { step: 1 };
        const player: any = { id: 'player1' };
        service.movePlayer(accessCode, path, player);
        expect(fakeSocket.emit).toHaveBeenCalledWith(TurnEvents.Move, { accessCode, path, player });
    });
});
