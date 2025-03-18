/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { HeaderBarComponent } from '@app/components/common/header-bar/header-bar.component';
import { FightLogicService } from '@app/services/fight-logic/fight-logic.service';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketService } from '@app/services/socket/socket.service';
import { Cell } from '@common/board';
import { PlayerStats } from '@common/player';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;

    const fightStartedSubject = new Subject<boolean>();
    const isDebugModeSubject = new BehaviorSubject<boolean>(false);
    const playingPlayersSubject = new BehaviorSubject<PlayerStats[]>([]);

    const gameServiceMock = {
        getAccessCode: jasmine.createSpy('getAccessCode').and.returnValue('ACCESS123'),
        confirmAndAbandonGame: jasmine.createSpy('confirmAndAbandonGame').and.returnValue(Promise.resolve(true)),
        isDebugMode: isDebugModeSubject,
        playingPlayers: playingPlayersSubject,
        activePlayer: new BehaviorSubject<PlayerStats>({ id: 'player1', name: 'testPlayer' } as PlayerStats),
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
        myPlayer: new BehaviorSubject<PlayerStats | null>({ id: 'player1', position: { x: 0, y: 0 }, life: 100 } as PlayerStats),
    };

    const socketServiceMock = {
        getGameRoom: jasmine.createSpy('getGameRoom').and.returnValue({
            organizerId: 'player1',
            accessCode: 'ACCESS123',
        }),
        readyUp: jasmine.createSpy('readyUp'),
        endDebugMode: jasmine.createSpy('endDebugMode'),
        quitGame: jasmine.createSpy('quitGame'),
        resetSocketState: jasmine.createSpy('resetSocketState'),
        getCurrentPlayerId: jasmine.createSpy('getCurrentPlayerId').and.returnValue('player1'),
        onWinner: jasmine.createSpy('onWinner').and.returnValue(of({ id: 'player1' })),
        onTimerUpdate: jasmine.createSpy('onTimerUpdate').and.returnValue(of({ remainingTime: 60 })),
        onTurnSwitch: jasmine.createSpy('onTurnSwitch').and.returnValue(of({ player: { id: 'player1', name: 'testPlayer' } })),
        onLoser: jasmine.createSpy('onLoser').and.returnValue(of({ id: 'player1', name: 'testPlayer' })),
        onEndGame: jasmine.createSpy('onEndGame').and.returnValue(of({ id: 'player1', name: 'testPlayer' })),
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
                { provide: SocketService, useValue: socketServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: MatDialog, useValue: dialogMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        // Assigner le headerBar avec le stub
        component.headerBar = headerBarStub as unknown as HeaderBarComponent;
        fixture.detectChanges();
    });

    afterEach(() => {
        // Réinitialiser les spies en les réassignant si nécessaire.
        // (Ici Jasmine gère les spies, il suffit de recréer le composant dans beforeEach)
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should call socketService.readyUp on ngOnInit if player exists', () => {
        component.ngOnInit();
        expect(socketServiceMock.readyUp).toHaveBeenCalledWith('ACCESS123', 'player1');
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
        expect(component.showChat).toBe(!initial);
        component.toggleChat();
        expect(component.showChat).toBe(initial);
    });

    describe('ngAfterViewInit', () => {
        it('should override headerBar.getBack and call original method when confirmed', fakeAsync(async () => {
            // Définir la méthode getBack originale avec un spy retournant "ORIGINAL"
            const originalGetBack = jasmine.createSpy('originalGetBack').and.returnValue(Promise.resolve('ORIGINAL'));
            headerBarStub.getBack = originalGetBack;

            // Appeler ngAfterViewInit qui surcharge getBack
            component.ngAfterViewInit();

            // Simuler l'appel à la méthode surchargée
            await component.headerBar.getBack();
            tick(); // simuler l'attente dans les promises

            expect(gameServiceMock.confirmAndAbandonGame).toHaveBeenCalled();
            expect(socketServiceMock.endDebugMode).toHaveBeenCalledWith('ACCESS123');
            expect(socketServiceMock.quitGame).toHaveBeenCalledWith('ACCESS123', 'player1');
        }));
    });

    describe('HostListeners', () => {
        it('onBeforeUnload should call quitGame and endDebugMode if organizer', () => {
            component.onBeforeUnload();
            expect(socketServiceMock.endDebugMode).toHaveBeenCalledWith('ACCESS123');
            expect(socketServiceMock.quitGame).toHaveBeenCalledWith('ACCESS123', 'player1');
        });

        it('onPageShow should call warning which opens dialog and navigates home', fakeAsync(() => {
            const warningSpy = spyOn<any>(component, 'warning').and.callThrough();
            component.onPageShow();
            tick();
            expect(warningSpy).toHaveBeenCalledWith("Vous avez été déconnecté de la partie, vous allez être redirigé vers la page d'accueil.");
        }));
    });

    describe('ngOnDestroy', () => {
        it('should unsubscribe from subscriptions and reset socket state', () => {
            // Ajouter une subscription fictive pour tester la désinscription.
            const dummySub = { unsubscribe: jasmine.createSpy('unsubscribe') };
            component['quitGameSubscription'] = dummySub as any;
            component.ngOnDestroy();
            expect(dummySub.unsubscribe).toHaveBeenCalled();
            expect(socketServiceMock.resetSocketState).toHaveBeenCalled();
        });
    });
});
