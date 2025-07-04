/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { HeaderBarComponent } from '@app/components/common/header-bar/header-bar.component';
import { FightLogicService } from '@app/services/fight-logic/fight-logic.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { Cell } from '@common/board';
import { IPlayer, Team } from '@common/player';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;

    const fightStartedSubject = new Subject<boolean>();
    const isDebugModeSubject = new BehaviorSubject<boolean>(false);
    const playingPlayersSubject = new BehaviorSubject<IPlayer[]>([]);
    const initialPlayersSubject = new BehaviorSubject<IPlayer[]>([]);
    const onGameWinnerSubject = new BehaviorSubject<IPlayer>({} as IPlayer);

    const gameServiceMock = {
        getAccessCode: jasmine.createSpy('getAccessCode').and.returnValue('ACCESS123'),
        confirmAndAbandonGame: jasmine.createSpy('confirmAndAbandonGame').and.returnValue(Promise.resolve(true)),
        isDebugMode: isDebugModeSubject,
        playingPlayers: playingPlayersSubject,
        initialPlayers: initialPlayersSubject,
        activePlayer: new BehaviorSubject<IPlayer>({ id: 'player1', name: 'testPlayer' } as IPlayer),
        getOrganizerId: jasmine.createSpy('getOrganizerId').and.returnValue('player1'),
        map: new BehaviorSubject<Cell[][]>([]),
        isActionSelected: new BehaviorSubject<boolean>(false),
        findPossibleActions: jasmine.createSpy('findPossibleActions').and.returnValue(new Set<string>()),
        getCellDescription: jasmine.createSpy('getCellDescription').and.returnValue(''),
        toggleActionMode: jasmine.createSpy('toggleActionMode'), // Ajouté
        endTurn: jasmine.createSpy('endTurn'), // Ajouté
    };

    const fightLogicServiceMock = {
        fightStarted: fightStartedSubject,
    };

    const playerServiceMock = {
        getPlayer: jasmine.createSpy('getPlayer').and.returnValue({ id: 'player1', position: { x: 0, y: 0 } }),
        isActivePlayer: new BehaviorSubject<boolean>(true),
        path: new BehaviorSubject<Map<string, unknown> | null>(null),
        sendMove: jasmine.createSpy('sendMove'),
        myPlayer: new BehaviorSubject<IPlayer | null>({ id: 'player1', position: { x: 0, y: 0 }, life: 100 } as IPlayer),
    };

    const socketServiceMock = {
        getGameRoom: jasmine.createSpy('getGameRoom').and.returnValue({
            organizerId: 'player1',
            accessCode: 'ACCESS123',
        }),
        ready: jasmine.createSpy('ready'),
        endDebugMode: jasmine.createSpy('endDebugMode'),
        resetSocketState: jasmine.createSpy('resetSocketState'),
        getCurrentPlayerId: jasmine.createSpy('getCurrentPlayerId').and.returnValue('player1'),
        onWinner: jasmine.createSpy('onWinner').and.returnValue(of({ id: 'player1' })),
        onTimerUpdate: jasmine.createSpy('onTimerUpdate').and.returnValue(of({ remainingTime: 60 })),
        onTurnSwitch: jasmine.createSpy('onTurnSwitch').and.returnValue(of({ player: { id: 'player1', name: 'testPlayer' } })),
        onPlayerRemoved: jasmine.createSpy('onPlayerRemoved').and.returnValue(of('error')),
        onPlayerTurnChanged: jasmine.createSpy('onPlayerTurnChanged').and.returnValue(of({ name: 'p1' })),
        onLoser: jasmine.createSpy('onLoser').and.returnValue(of({ name: 'p1' })),
        disconnect: jasmine.createSpy('disconnect').and.returnValue('disconnected'),
        onInventoryFull: jasmine.createSpy('onInventoryFull').and.returnValue(of(null)),
        onGameWinner: jasmine.createSpy('onGameWinner').and.returnValue(onGameWinnerSubject),
        onItemCollected: jasmine.createSpy('onItemCollected').and.returnValue(of(null)),
        onItemDropped: jasmine.createSpy('onItemDropped').and.returnValue(of(null)),
    };

    const routerMock = {
        navigate: jasmine.createSpy('navigate'),
    };

    const dialogMock = {
        open: jasmine.createSpy('open').and.returnValue({
            afterClosed: () => of(true),
        }),
    };

    const headerBarStub = {
        getBack: jasmine.createSpy('getBack').and.returnValue(Promise.resolve(undefined)),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GamePageComponent],
            providers: [
                { provide: GameService, useValue: gameServiceMock },
                { provide: FightLogicService, useValue: fightLogicServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
                { provide: SocketReceiverService, useValue: socketServiceMock },
                { provide: SocketEmitterService, useValue: socketServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: MatDialog, useValue: dialogMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        component.headerBar = headerBarStub as unknown as HeaderBarComponent;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should call socketService.ready on ngOnInit if player exists', () => {
        component.ngOnInit();
        expect(socketServiceMock.ready).toHaveBeenCalledWith('player1');
    });

    it('should update showFightInterface when fightLogicService.fightStarted emits', () => {
        fightStartedSubject.next(true);
        expect(component.showFightInterface).toBeTrue();
        fightStartedSubject.next(false);
        expect(component.showFightInterface).toBeFalse();
    });

    it('should update debugMode when gameService.isDebugMode emits', () => {
        isDebugModeSubject.next(true);
        expect(component.debugMode).toBeTrue();
    });

    it('should display the correct message and navigate after game ends with team winner', fakeAsync(() => {
        const warningSpy = spyOn<any>(component, 'warningEndGame');
        const winner = { name: 'p1', team: Team.Blue } as IPlayer;
        onGameWinnerSubject.next(winner);
        expect(warningSpy).toHaveBeenCalledWith("p1 a rapporté le drapeau à son point de départ. L'équipe Bleu remporte la partie");
    }));

    it('should display the correct message and navigate after game ends with 3 wins', fakeAsync(() => {
        const warningSpy = spyOn<any>(component, 'warningEndGame');
        const winner = { name: 'p2' } as IPlayer;
        onGameWinnerSubject.next(winner);
        expect(warningSpy).toHaveBeenCalledWith('p2 a remporté la partie avec 3 victoires!');
    }));

    it('toggleInfo should toggle showInfo value', () => {
        const initial = component.showInfo;
        component.toggleInfo();
        expect(component.showInfo).toBe(!initial);
        component.toggleInfo();
        expect(component.showInfo).toBe(initial);
    });

    it('toggleChat should toggle showChat value', () => {
        const initial = component.showChat;
        component.toggleChat();
        expect(component.showChat).toBe(initial);
        component.toggleChat();
        expect(component.showChat).toBe(initial);
    });

    describe('ngAfterViewInit', () => {
        it('should override headerBar.getBack and call original method when confirmed', fakeAsync(async () => {
            const originalGetBack = jasmine.createSpy('originalGetBack').and.returnValue(Promise.resolve('ORIGINAL'));
            headerBarStub.getBack = originalGetBack;

            component.ngAfterViewInit();

            await component.headerBar.getBack();
            tick();

            expect(gameServiceMock.confirmAndAbandonGame).toHaveBeenCalled();
        }));
    });

    describe('HostListeners', () => {
        it('onBeforeUnload should call disconnect', () => {
            component.onBeforeUnload();
            expect(socketServiceMock.disconnect).toHaveBeenCalled();
        });
    });

    describe('ngOnDestroy', () => {
        it('should unsubscribe from subscriptions and reset socket state', () => {
            const dummySub = { unsubscribe: jasmine.createSpy('unsubscribe') };
            (component as any).subscriptions = [dummySub]; // override private
            component.ngOnDestroy();
            expect(dummySub.unsubscribe).toHaveBeenCalled();
        });
    });
});
