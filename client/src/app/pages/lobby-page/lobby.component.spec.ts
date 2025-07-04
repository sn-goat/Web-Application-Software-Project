/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-empty-function */

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MockRouter } from '@app/helpers/router-mock';
import { MockSocketService } from '@app/helpers/socket-service-mock';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { RoomService } from '@app/services/room/room.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { IGame } from '@common/game';
import { getLobbyLimit } from '@common/lobby-limits';
import { IPlayer } from '@common/player';
import { BehaviorSubject, of } from 'rxjs';
import { LobbyComponent } from './lobby.component';

@Component({ selector: 'app-chat', template: '', standalone: true })
class ChatStubComponent {}

describe('LobbyComponent', () => {
    let component: LobbyComponent;
    let fixture: ComponentFixture<LobbyComponent>;
    let socketServiceMock: MockSocketService;
    let router: MockRouter;
    let lobbyLimit: number;

    const players = [{ id: 'current-player' }, { id: 'p2' }] as IPlayer[];

    const dialogMock = {
        open: jasmine.createSpy('open').and.returnValue({
            afterClosed: () => of(true),
        }),
    };

    const gameServiceMock = {
        setGame: jasmine.createSpy('setGame'),
    };

    const playerServiceMock = {
        isPlayerAdmin: jasmine.createSpy('isPlayerAdmin'),
        getPlayer: jasmine.createSpy('getPlayer').and.returnValue(players[0]),
        myPlayer: new BehaviorSubject<IPlayer>(players[0]),
    };

    const roomServiceMock = {
        connected: new BehaviorSubject<IPlayer[]>([]),
        isRoomLocked: new BehaviorSubject<boolean>(false),
        maxPlayer: new BehaviorSubject<number>(4),
    };

    beforeEach(() => {
        socketServiceMock = new MockSocketService();
        router = new MockRouter();
        lobbyLimit = getLobbyLimit(15);

        TestBed.configureTestingModule({
            imports: [CommonModule, LobbyComponent, ChatStubComponent],
            providers: [
                { provide: SocketEmitterService, useValue: socketServiceMock },
                { provide: SocketReceiverService, useValue: socketServiceMock },
                { provide: GameService, useValue: gameServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
                { provide: RoomService, useValue: roomServiceMock },
                { provide: MatDialog, useValue: dialogMock },
                { provide: Router, useValue: router },
            ],
        })
            .overrideComponent(LobbyComponent, {
                set: {
                    imports: [CommonModule, FormsModule, ChatStubComponent],
                },
            })
            .compileComponents();

        fixture = TestBed.createComponent(LobbyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should set maxPlayers based on game size', () => {
        expect(component.maxPlayers).toBe(lobbyLimit);
    });

    it('should update players when a player joins', () => {
        const newPlayer = { id: 'player1' } as IPlayer;
        const data = [newPlayer];
        socketServiceMock.triggerOnPlayersUpdated(data);
        expect(component.players).toEqual([newPlayer]);
    });

    it('should navigate home if current player is removed', fakeAsync(() => {
        spyOn(window, 'confirm').and.returnValue(true);
        socketServiceMock.triggerPlayerRemoved();
        component.disconnect();
        tick();
        expect(router.navigate).toHaveBeenCalledWith(['/accueil']);
    }));

    it('should trigger a disconnect if current player disconnects', fakeAsync(() => {
        spyOn(socketServiceMock, 'disconnect');
        component.disconnect();
        tick();
        expect(playerServiceMock.getPlayer).toHaveBeenCalled();
        expect(socketServiceMock.disconnect).toHaveBeenCalled();
    }));

    it('toggleRoomLock should call unlockRoom if room is locked', () => {
        spyOn(socketServiceMock, 'unlockRoom');
        component.maxPlayers = 5;
        component.isRoomLocked = true;
        component.accessCode = 'XYZ';
        component.toggleRoomLock();
        expect(socketServiceMock.unlockRoom).toHaveBeenCalled();
        expect(component.isRoomLocked).toBeFalse();
    });

    it('toggleRoomLock should call lockRoom if room is unlocked', () => {
        spyOn(socketServiceMock, 'lockRoom');
        // force state: room is unlocked and players below max
        component.isRoomLocked = false;
        component.accessCode = 'XYZ';
        component.toggleRoomLock();
        expect(socketServiceMock.lockRoom).toHaveBeenCalled();
        expect(component.isRoomLocked).toBeTrue();
    });

    it('toggleRoomLock should do nothing if players count is greater or equal to maxPlayers', () => {
        spyOn(socketServiceMock, 'lockRoom');
        spyOn(socketServiceMock, 'unlockRoom');
        component.maxPlayers = 3;
        component.players = [{ id: 'player1' } as IPlayer, { id: 'player2' } as IPlayer, { id: 'player3' } as IPlayer];
        component.accessCode = 'XYZ';
        component.isRoomLocked = false;

        component.toggleRoomLock();

        expect(socketServiceMock.lockRoom).not.toHaveBeenCalled();
        expect(socketServiceMock.unlockRoom).not.toHaveBeenCalled();

        expect(component.isRoomLocked).toBeFalse();
    });

    it('removePlayer should trigger socketServiceMock.expelPlayer', () => {
        spyOn(socketServiceMock, 'expelPlayer');
        component.expelPlayer('player2');
        expect(socketServiceMock.expelPlayer).toHaveBeenCalledWith('player2');
    });

    it('should return current player id when called', () => {
        expect(component.getPlayerId()).toEqual('current-player');
    });

    it('should start the game when called', () => {
        spyOn(socketServiceMock, 'startGame');
        component.startGame();
        expect(socketServiceMock.startGame).toHaveBeenCalled();
    });

    it('should set game and navigate to game page when onGameStarted emits', fakeAsync(() => {
        // Arrange
        const mockGame = {
            players: [{ id: 'player1' } as IPlayer],
            isCTF: false,
        } as IGame;

        // Act
        socketServiceMock.triggerOnGameStarted(mockGame);
        tick();

        // Assert
        expect(gameServiceMock.setGame).toHaveBeenCalledWith(mockGame);
        expect(router.navigate).toHaveBeenCalledWith(['/jeu']);
    }));

    it('should open a dialog when an error is received', () => {
        socketServiceMock.triggerOnGameStartedError('error');
        expect(dialogMock.open).toHaveBeenCalled();
    });
});
