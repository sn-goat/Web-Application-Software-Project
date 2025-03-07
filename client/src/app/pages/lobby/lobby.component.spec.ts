/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SocketService } from '@app/services/code/socket.service';
import { getLobbyLimit } from '@common/lobby-limits';
import { Player } from '@common/player';
import { Subject } from 'rxjs';
import { LobbyComponent } from './lobby.component';

class FakeSocketService {
    private playerJoinedSubject = new Subject<unknown>();
    private playersListSubject = new Subject<Player[]>();
    private playerRemovedSubject = new Subject<Player[]>();
    private playerDisconnectedSubject = new Subject<Player[]>();
    private roomLockedSubject = new Subject<unknown>();

    getGameSize() {
        return 15; // Retourne une taille numérique appropriée
    }

    getCurrentPlayerId(): string {
        return 'current-player';
    }

    onPlayerJoined() {
        return this.playerJoinedSubject.asObservable();
    }

    onPlayersList() {
        return this.playersListSubject.asObservable();
    }

    onPlayerRemoved() {
        return this.playerRemovedSubject.asObservable();
    }

    onPlayerDisconnected() {
        return this.playerDisconnectedSubject.asObservable();
    }

    onRoomLocked() {
        return this.roomLockedSubject.asObservable();
    }

    lockRoom(_accessCode: string): void {}
    unlockRoom(_accessCode: string): void {}
    removePlayer(_accessCode: string, _playerId: string): void {}
    disconnect(_accessCode: string, _playerId: string): void {}

    // Helpers to trigger events in tests
    triggerPlayerJoined(data: unknown) {
        this.playerJoinedSubject.next(data);
    }

    triggerPlayersList(players: Player[]) {
        this.playersListSubject.next(players);
    }

    triggerPlayerRemoved(players: Player[]) {
        this.playerRemovedSubject.next(players);
    }

    triggerPlayerDisconnected(players: Player[]) {
        this.playerDisconnectedSubject.next(players);
    }

    triggerRoomLocked(data: unknown) {
        this.roomLockedSubject.next(data);
    }
}

class FakeRouter {
    navigate = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));
}

describe('LobbyComponent', () => {
    let component: LobbyComponent;
    let fixture: ComponentFixture<LobbyComponent>;
    let socketService: FakeSocketService;
    let router: FakeRouter;
    let lobbyLimit: number;

    beforeEach(() => {
        socketService = new FakeSocketService();
        router = new FakeRouter();
        lobbyLimit = getLobbyLimit(15);

        TestBed.configureTestingModule({
            imports: [LobbyComponent],
            providers: [
                { provide: SocketService, useValue: socketService },
                { provide: Router, useValue: router },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LobbyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should set maxPlayers based on game size', () => {
        expect(component.maxPlayers).toBe(lobbyLimit);
    });

    it('should update players when a player joins', fakeAsync(() => {
        const newPlayer: Player = { id: 'player1' } as Player;
        const data = { room: { players: [newPlayer], accessCode: 'ABC123' } };
        socketService.triggerPlayerJoined(data);
        tick();
        expect(component.players).toEqual([newPlayer]);
        expect(component.accessCode).toEqual('ABC123');
        // Check if admin status is set: current-player is 'current-player'
        // In this test, since first player is 'player1' and not current, isAdmin should be false.
        expect(component.isAdmin).toBeFalse();
    }));

    it('should update players and lock room if player count equals maxPlayers', fakeAsync(() => {
        spyOn(socketService, 'lockRoom');
        // Définir un accessCode non vide pour le test
        component.accessCode = 'XYZ';

        // simulate players list with players count equals lobbyLimit
        const players: Player[] = [];
        // First player is current-player for admin
        players.push({ id: 'current-player' } as Player);
        // Fill with dummy players up to lobbyLimit
        for (let i = 1; i < lobbyLimit; i++) {
            players.push({ id: 'player' + i } as Player);
        }
        socketService.triggerPlayersList(players);
        tick();

        expect(component.players).toEqual(players);
        expect(component.isRoomLocked).toBeTrue();
        expect(socketService.lockRoom).toHaveBeenCalledWith(component.accessCode);
    }));

    it('should navigate home if current player is removed', fakeAsync(() => {
        spyOn(window, 'confirm').and.returnValue(true);
        // simulate removal such that current player is not in the list
        socketService.triggerPlayerRemoved([]);
        tick();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    }));

    it('should navigate home if current player disconnects', fakeAsync(() => {
        spyOn(window, 'confirm').and.returnValue(true);
        socketService.triggerPlayerDisconnected([]);
        tick();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    }));

    it('checkIfAdmin should set isAdmin true if current player is first in list', () => {
        const players: Player[] = [{ id: 'current-player' } as Player, { id: 'player2' } as Player];
        component.players = players;
        component.checkIfAdmin();
        expect(component.isAdmin).toBeTrue();
    });

    it('toggleRoomLock should call unlockRoom if room is locked', () => {
        spyOn(socketService, 'unlockRoom');
        // Forcer l'état: la room est verrouillée et il y a moins de joueurs que maxPlayers
        component.players = [{ id: 'current-player' } as Player];
        component.maxPlayers = 5; // s'assurer que 1 < maxPlayers
        component.isRoomLocked = true;
        component.accessCode = 'XYZ';
        component.toggleRoomLock();
        expect(socketService.unlockRoom).toHaveBeenCalledWith('XYZ');
        expect(component.isRoomLocked).toBeFalse();
    });

    it('toggleRoomLock should call lockRoom if room is unlocked', () => {
        spyOn(socketService, 'lockRoom');
        // force state: room is unlocked and players below max
        component.players = [{ id: 'current-player' } as Player];
        component.isRoomLocked = false;
        component.accessCode = 'XYZ';
        component.toggleRoomLock();
        expect(socketService.lockRoom).toHaveBeenCalledWith('XYZ');
        expect(component.isRoomLocked).toBeTrue();
    });

    it('toggleRoomLock should do nothing if players count is greater or equal to maxPlayers', () => {
        // Créer des espions sur lockRoom et unlockRoom
        spyOn(socketService, 'lockRoom');
        spyOn(socketService, 'unlockRoom');
        // On force maxPlayers et le nombre de joueurs à être égaux ou supérieurs
        component.maxPlayers = 3;
        component.players = [{ id: 'player1' } as Player, { id: 'player2' } as Player, { id: 'player3' } as Player];
        component.accessCode = 'XYZ';
        // On définit isRoomLocked à l'une ou l'autre valeur (peu importe)
        component.isRoomLocked = false;

        // Appel de la méthode toggleRoomLock qui doit retourner immédiatement sans rien faire.
        component.toggleRoomLock();

        // Vérifier qu'aucune méthode n'est appelée
        expect(socketService.lockRoom).not.toHaveBeenCalled();
        expect(socketService.unlockRoom).not.toHaveBeenCalled();

        // La valeur de isRoomLocked ne doit pas changer
        expect(component.isRoomLocked).toBeFalse();
    });

    it('removePlayer should trigger socketService.removePlayer', () => {
        spyOn(socketService, 'removePlayer');
        component.accessCode = 'ABC';
        component.removePlayer('player2');
        expect(socketService.removePlayer).toHaveBeenCalledWith('ABC', 'player2');
    });

    it('disconnect should call socketService.disconnect and navigate home without reloading', fakeAsync(() => {
        spyOn(socketService, 'disconnect');
        component.accessCode = 'ABC';
        component.disconnectWithoutReload();
        tick();
        expect(socketService.disconnect).toHaveBeenCalledWith('ABC', 'current-player');
    }));

    it('disconnect should call socketService.disconnect', fakeAsync(() => {
        spyOn(socketService, 'disconnect');
        component.accessCode = 'ABC';
        component.disconnectWithoutReload();
        tick();
        expect(socketService.disconnect).toHaveBeenCalledWith('ABC', 'current-player');
    }));

    it('disconnect should call socketService.disconnect without reloading the page', fakeAsync(() => {
        spyOn(socketService, 'disconnect');

        component.accessCode = 'ABC';
        component.disconnectWithoutReload();
        tick();

        expect(socketService.disconnect).toHaveBeenCalledWith('ABC', 'current-player');
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    }));

    it('disconnectWithoutReload should call socketService.disconnect and navigate home without reloading', fakeAsync(() => {
        spyOn(socketService, 'disconnect');

        component.accessCode = 'ABC';
        component.disconnectWithoutReload();
        tick();

        expect(socketService.disconnect).toHaveBeenCalledWith('ABC', 'current-player');
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    }));

    it('should set accessCode from history state if available', () => {
        spyOnProperty(history, 'state').and.returnValue({ accessCode: 'HISTORY_CODE' });
        component.ngOnInit();
        expect(component.accessCode).toBe('HISTORY_CODE');
    });

    it('checkIfAdmin should set isAdmin false if first player is not current-player', () => {
        component.players = [{ id: 'other-player' } as Player, { id: 'current-player' } as Player];
        component.checkIfAdmin();
        expect(component.isAdmin).toBeFalse();
    });

    it('getCurrentPlayerId should return the id from socketService', () => {
        spyOn(socketService, 'getCurrentPlayerId').and.returnValue('current-player');
        expect(component.getCurrentPlayerId()).toBe('current-player');
    });
});
