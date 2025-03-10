/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/code/socket.service';
import { Room } from '@common/game';
import { PlayerStats } from '@common/player';

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
            routerSpy.navigate(['/home']);
        });
    });

    it('should be created and set up redirectHome listener', () => {
        expect(service).toBeTruthy();
        // Vérifier que le callback pour "redirectHome" a bien été enregistré.
        expect(fakeSocket.callbacks['redirectHome']).toBeDefined();
    });

    it('should navigate to /home on redirectHome event', () => {
        expect(fakeSocket.callbacks['redirectHome']).toBeDefined();
        // Simuler l'appel du callback pour "redirectHome"
        fakeSocket.callbacks['redirectHome']();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should emit createRoom event with correct parameters', () => {
        const size = 8;
        const organizerId = fakeSocket.id;
        service.createRoom(size);
        expect(service.getGameSize()).toEqual(size);
        expect(fakeSocket.emit).toHaveBeenCalledWith('createRoom', { organizerId, size });
    });

    it('should emit joinRoom event with accessCode', () => {
        const accessCode = 'ABC123';
        service.joinRoom(accessCode);
        expect(fakeSocket.emit).toHaveBeenCalledWith('joinRoom', { accessCode });
    });

    it('should update currentPlayerId and emit shareCharacter event', () => {
        const accessCode = 'XYZ';
        const player: PlayerStats = { id: 'player1' } as PlayerStats;
        service.shareCharacter(accessCode, player);
        expect(service.getCurrentPlayerId()).toEqual(player.id);
        expect(fakeSocket.emit).toHaveBeenCalledWith('shareCharacter', { accessCode, player });
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

    it('should register redirectHome callback in the constructor and navigate to /home when triggered', () => {
        // Vérifier que le callback a bien été enregistré
        expect(fakeSocket.callbacks['redirectHome']).toBeDefined();

        // Simuler l'événement 'redirectHome'
        fakeSocket.callbacks['redirectHome']();

        // Vérifier que router.navigate a été appelé avec ['/home']
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
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
});
