/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { ChatComponent } from '@app/components/chat/chat.component';
import { AlertComponent } from '@app/components/common/alert/alert.component';
import { HeaderBarComponent } from '@app/components/common/header-bar/header-bar.component';
import { StatsComponent } from '@app/components/stats/stats.component';
import { Alert } from '@app/constants/enums';
import { GameService } from '@app/services/game/game.service';
import { PlayerService } from '@app/services/player/player.service';
import { SocketEmitterService } from '@app/services/socket/socket-emitter.service';
import { SocketReceiverService } from '@app/services/socket/socket-receiver.service';
import { IPlayer } from '@common/player';
import { Subject, of } from 'rxjs';
import { StatsPageComponent } from './stats-page.component';

describe('StatsPageComponent', () => {
    let component: StatsPageComponent;
    let fixture: ComponentFixture<StatsPageComponent>;
    let gameServiceMock: jasmine.SpyObj<GameService>;
    let socketEmitterMock: jasmine.SpyObj<SocketEmitterService>;
    let socketReceiverMock: jasmine.SpyObj<SocketReceiverService>;
    let playerServiceMock: jasmine.SpyObj<PlayerService>;
    let routerMock: jasmine.SpyObj<Router>;
    let headerBarMock: jasmine.SpyObj<HeaderBarComponent>;
    let dialogMock: jasmine.SpyObj<MatDialog>;
    let playerRemovedSubject: Subject<string>;
    const testPlayerId = 'test-player-id';
    const mockPlayer: IPlayer = { id: testPlayerId, name: 'Test Player' } as IPlayer;

    beforeEach(async () => {
        gameServiceMock = jasmine.createSpyObj('GameService', ['confirmAndQuitGame']);
        socketEmitterMock = jasmine.createSpyObj('SocketEmitterService', ['disconnect']);
        playerServiceMock = jasmine.createSpyObj('PlayerService', ['getPlayer']);
        routerMock = jasmine.createSpyObj('Router', ['navigate']);
        headerBarMock = jasmine.createSpyObj('HeaderBarComponent', ['getBack']);
        dialogMock = jasmine.createSpyObj('MatDialog', ['open']);

        playerRemovedSubject = new Subject<string>();
        socketReceiverMock = jasmine.createSpyObj('SocketReceiverService', ['onPlayerRemoved']);
        socketReceiverMock.onPlayerRemoved.and.returnValue(playerRemovedSubject.asObservable());

        playerServiceMock.getPlayer.and.returnValue(mockPlayer);

        await TestBed.configureTestingModule({
            imports: [StatsPageComponent, BrowserAnimationsModule],
            providers: [
                { provide: GameService, useValue: gameServiceMock },
                { provide: SocketEmitterService, useValue: socketEmitterMock },
                { provide: SocketReceiverService, useValue: socketReceiverMock },
                { provide: PlayerService, useValue: playerServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: HeaderBarComponent, useValue: headerBarMock },
                { provide: MatDialog, useValue: dialogMock },
            ],
        })
            .overrideComponent(StatsPageComponent, {
                remove: { imports: [StatsComponent, ChatComponent] },
                add: { imports: [] },
            })
            .compileComponents();

        fixture = TestBed.createComponent(StatsPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('onBeforeUnload', () => {
        it('should disconnect the player when browser is about to unload', () => {
            playerServiceMock.getPlayer.and.returnValue(mockPlayer);

            component.onBeforeUnload();
            expect(socketEmitterMock.disconnect).toHaveBeenCalledWith(testPlayerId);
        });
    });

    describe('ngOnInit', () => {
        it('should subscribe to player removed events', () => {
            component.headerBar = {
                getBack: jasmine.createSpy('getBack').and.returnValue(Promise.resolve()),
            } as any;

            fixture.detectChanges();
            expect(socketReceiverMock.onPlayerRemoved).toHaveBeenCalled();
        });

        it('should handle player removed notification and navigate to home page', () => {
            component.headerBar = {
                getBack: jasmine.createSpy('getBack').and.returnValue(Promise.resolve()),
            } as any;

            spyOn<any>(component, 'warning').and.callThrough();
            spyOn<any>(component, 'openDialog').and.returnValue(Promise.resolve(true));

            fixture.detectChanges();

            playerRemovedSubject.next('Player was removed');

            expect(component['warning']).toHaveBeenCalledWith('Player was removed');

            fixture.whenStable().then(() => {
                expect(routerMock.navigate).toHaveBeenCalledWith(['/accueil']);
            });
        });
    });

    describe('ngAfterViewInit', () => {
        it('should override the getBack method of the headerBar', () => {
            component.headerBar = {
                getBack: jasmine.createSpy('getBack').and.returnValue(Promise.resolve()),
            } as any;

            const originalGetBack = component.headerBar.getBack;

            component.ngAfterViewInit();

            expect(component.headerBar.getBack).not.toBe(originalGetBack);
        });

        it('should call socketEmitter.disconnect and original getBack when quit is confirmed', async () => {
            playerServiceMock.getPlayer.and.returnValue(mockPlayer);

            const originalGetBackSpy = jasmine.createSpy('getBack').and.returnValue(Promise.resolve());
            component.headerBar = {
                getBack: originalGetBackSpy,
            } as any;

            gameServiceMock.confirmAndQuitGame.and.returnValue(Promise.resolve(true));

            component.ngAfterViewInit();

            await component.headerBar.getBack();

            expect(gameServiceMock.confirmAndQuitGame).toHaveBeenCalled();
            expect(socketEmitterMock.disconnect).toHaveBeenCalledWith(testPlayerId);
            expect(originalGetBackSpy).toHaveBeenCalled();
        });

        it('should not call original getBack when quit is cancelled', async () => {
            const originalGetBackSpy = jasmine.createSpy('getBack');
            component.headerBar = {
                getBack: originalGetBackSpy,
            } as any;

            gameServiceMock.confirmAndQuitGame.and.returnValue(Promise.resolve(false));

            component.ngAfterViewInit();

            await component.headerBar.getBack();

            expect(gameServiceMock.confirmAndQuitGame).toHaveBeenCalled();
            expect(originalGetBackSpy).not.toHaveBeenCalled();
            expect(socketEmitterMock.disconnect).not.toHaveBeenCalled();
        });
    });

    describe('ngOnDestroy', () => {
        it('should unsubscribe from all subscriptions', () => {
            const subscription1 = jasmine.createSpyObj('Subscription', ['unsubscribe']);
            const subscription2 = jasmine.createSpyObj('Subscription', ['unsubscribe']);
            component['subscriptions'] = [subscription1, subscription2];

            component.ngOnDestroy();

            expect(subscription1.unsubscribe).toHaveBeenCalled();
            expect(subscription2.unsubscribe).toHaveBeenCalled();
        });
    });

    describe('private methods', () => {
        it('should open a dialog with correct parameters when warning is called', () => {
            spyOn<any>(component, 'openDialog').and.returnValue(Promise.resolve(true));

            component['warning']('Test warning message');

            expect(component['openDialog']).toHaveBeenCalledWith('Test warning message', Alert.WARNING);
        });

        it('should open dialog with correct parameters via openDialog method', async () => {
            const mockDialogRef = {
                afterClosed: () => of(true),
            };
            dialogMock.open.and.returnValue(mockDialogRef as any);

            const result = await component['openDialog']('Test message', Alert.CONFIRM);

            expect(dialogMock.open).toHaveBeenCalledWith(AlertComponent, {
                data: { type: Alert.CONFIRM, message: 'Test message' },
                disableClose: true,
                hasBackdrop: true,
                backdropClass: 'backdrop-block',
                panelClass: 'alert-dialog',
            });

            expect(result).toBe(true);
        });

        it('should return dialog result from openDialog method', async () => {
            const mockDialogRefTrue = {
                afterClosed: () => of(true),
            };
            dialogMock.open.and.returnValue(mockDialogRefTrue as any);

            const resultTrue = await component['openDialog']('Test message', Alert.CONFIRM);
            expect(resultTrue).toBe(true);

            const mockDialogRefFalse = {
                afterClosed: () => of(false),
            };
            dialogMock.open.and.returnValue(mockDialogRefFalse as any);

            const resultFalse = await component['openDialog']('Another test', Alert.WARNING);
            expect(resultFalse).toBe(false);
        });
    });
});
