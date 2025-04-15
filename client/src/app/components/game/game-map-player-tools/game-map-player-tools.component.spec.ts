/* eslint-disable @typescript-eslint/no-magic-numbers */
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { TurnInfo } from '@common/game';
import { IPlayer } from '@common/player';
import { Subject } from 'rxjs';
import { GameMapPlayerToolsComponent } from './game-map-player-tools.component';

describe('GameMapPlayerToolsComponent', () => {
    let component: GameMapPlayerToolsComponent;
    let fixture: ComponentFixture<GameMapPlayerToolsComponent>;
    let gameServiceMock: jasmine.SpyObj<GameService>;
    let playerServiceMock: jasmine.SpyObj<PlayerService>;
    let socketServiceMock: jasmine.SpyObj<SocketReceiverService>;
    let snackBarMock: jasmine.SpyObj<MatSnackBar>;

    const isActivePlayerSubject = new Subject<boolean>();
    const myPlayerSubject = new Subject<IPlayer | null>();
    const isActionSelectedSubject = new Subject<boolean>();
    const activePlayerSubject = new Subject<IPlayer | null>();
    const timerUpdateSubject = new Subject<number>();
    const turnSwitchSubject = new Subject<TurnInfo>();
    const winnerSubject = new Subject<IPlayer>();
    const loserSubject = new Subject<IPlayer>();
    const mockPlayer: IPlayer = { id: '123', name: 'TestPlayer', actions: 1, position: { x: 0, y: 0 }, life: 100, movementPts: 3 } as IPlayer;

    beforeEach(() => {
        gameServiceMock = jasmine.createSpyObj('GameService', ['toggleActionMode', 'endTurn'], {
            isActionSelected: isActionSelectedSubject,
            activePlayer: activePlayerSubject,
        });

        playerServiceMock = jasmine.createSpyObj('PlayerService', ['getPlayer', 'myPlayer'], {
            isActivePlayer: isActivePlayerSubject,
            myPlayer: myPlayerSubject,
        });
        playerServiceMock.getPlayer.and.returnValue(mockPlayer);

        socketServiceMock = jasmine.createSpyObj('SocketService', ['onTimerUpdate', 'onPlayerTurnChanged', 'onWinner', 'onLoser']);
        socketServiceMock.onTimerUpdate.and.returnValue(timerUpdateSubject);
        socketServiceMock.onPlayerTurnChanged.and.returnValue(turnSwitchSubject);
        socketServiceMock.onWinner.and.returnValue(winnerSubject);
        socketServiceMock.onLoser.and.returnValue(loserSubject);
        snackBarMock = jasmine.createSpyObj('MatSnackBar', ['openFromComponent']);

        TestBed.configureTestingModule({
            imports: [GameMapPlayerToolsComponent],
            providers: [
                { provide: GameService, useValue: gameServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
                { provide: SocketReceiverService, useValue: socketServiceMock },
                { provide: MatSnackBar, useValue: snackBarMock },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapPlayerToolsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update isActivePlayer when playerService emits', () => {
        isActivePlayerSubject.next(true);
        expect(component.isActivePlayer).toBeTrue();

        isActivePlayerSubject.next(false);
        expect(component.isActivePlayer).toBeFalse();
    });

    it('should update playerHasAction when myPlayer emits', () => {
        myPlayerSubject.next({ ...mockPlayer, actions: 1 });
        expect(component.playerHasAction).toBeTrue();

        myPlayerSubject.next({ ...mockPlayer, actions: 0 });
        expect(component.playerHasAction).toBeFalse();

        myPlayerSubject.next(null);
        expect(component.playerHasAction).toBeFalse();
    });

    it('should update isActionEnabled when gameService emits', () => {
        isActionSelectedSubject.next(true);
        expect(component.isActionEnabled).toBeTrue();

        isActionSelectedSubject.next(false);
        expect(component.isActionEnabled).toBeFalse();
    });

    it('should update timer on timer update', () => {
        timerUpdateSubject.next(30);
        expect(component.timer).toBe('30 s');
    });

    it('should update activePlayer and show snackbar on turn switch when not active player', () => {
        component.isActivePlayer = false;
        turnSwitchSubject.next({ player: mockPlayer } as TurnInfo);
        expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });

    it('should not show snackbar on turn switch when active player', () => {
        component.isActivePlayer = true;
        turnSwitchSubject.next({ player: mockPlayer } as TurnInfo);
        expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });

    it('should show winner snackbar if player is winner', () => {
        winnerSubject.next(mockPlayer);
        expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });

    it('should show loser snackbar if player is loser', () => {
        loserSubject.next(mockPlayer);
        expect(snackBarMock.openFromComponent).toHaveBeenCalled();
    });

    it('should bind performAction to gameService.toggleActionMode', () => {
        component.performAction();
        expect(gameServiceMock.toggleActionMode).toHaveBeenCalled();
    });

    it('should bind endTurn to gameService.endTurn', () => {
        component.endTurn();
        expect(gameServiceMock.endTurn).toHaveBeenCalled();
    });
});
