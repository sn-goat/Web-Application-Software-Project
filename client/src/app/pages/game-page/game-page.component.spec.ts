// import { CommonModule } from '@angular/common';
// import { Component } from '@angular/core';
// import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
// import { GameService } from '@app/services/code/game.service';
// import { PlayerService } from '@app/services/code/player.service';
// import { BehaviorSubject } from 'rxjs';

// interface HeaderBarMock {
//     getBack: () => void;
//     backUrl: string;
// }

// @Component({
//     selector: 'app-game-page',
//     template: `
//         <div>Test Game Page Component</div>
//         <div *ngIf="showFightInterface">Fight Interface is shown</div>
//     `,
//     standalone: true,
//     imports: [CommonModule],
// })
// // eslint-disable-next-line @angular-eslint/component-class-suffix
// class GamePageComponentTestable {
//     showFightInterface = false;

//     originalMethodCalled = false;

//     constructor(
//         public gameService: GameService,
//         public playerService: PlayerService,
//     ) {
//         gameService.showFightInterface$.subscribe((show) => {
//             this.showFightInterface = show;
//         });
//     }

//     handleBackAction(headerBar: HeaderBarMock, onOriginalCalled?: () => void): void {
//         const originalGetBack = headerBar.getBack;

//         headerBar.getBack = () => {
//             this.gameService.confirmAndAbandonGame(this.playerService.getPlayerName()).then((confirmed) => {
//                 if (confirmed) {
//                     originalGetBack.call(headerBar);
//                     if (onOriginalCalled) {
//                         onOriginalCalled();
//                     }
//                     this.originalMethodCalled = true;
//                 }
//             });
//         };
//     }
// }

// describe('GamePageComponent', () => {
//     let component: GamePageComponentTestable;
//     let fixture: ComponentFixture<GamePageComponentTestable>;
//     let gameServiceMock: jasmine.SpyObj<GameService>;
//     let playerServiceMock: jasmine.SpyObj<PlayerService>;
//     let showFightInterfaceSubject: BehaviorSubject<boolean>;

//     beforeEach(async () => {
//         showFightInterfaceSubject = new BehaviorSubject<boolean>(false);

//         playerServiceMock = jasmine.createSpyObj('PlayerService', ['getPlayerName']);
//         // playerServiceMock.getPlayer..and.returnValue('testUser');

//         gameServiceMock = jasmine.createSpyObj('GameService', ['confirmAndAbandonGame']);
//         gameServiceMock.showFightInterface$ = showFightInterfaceSubject;
//         gameServiceMock.confirmAndAbandonGame.and.returnValue(Promise.resolve(true));

//         await TestBed.configureTestingModule({
//             imports: [CommonModule, GamePageComponentTestable],
//             providers: [
//                 { provide: GameService, useValue: gameServiceMock },
//                 { provide: PlayerService, useValue: playerServiceMock },
//             ],
//         }).compileComponents();

//         fixture = TestBed.createComponent(GamePageComponentTestable);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should update showFightInterface on subscription', () => {
//         showFightInterfaceSubject.next(true);
//         expect(component.showFightInterface).toBeTrue();

//         showFightInterfaceSubject.next(false);
//         expect(component.showFightInterface).toBeFalse();
//     });

//     it('should override headerBar.getBack and call original method if confirmed', fakeAsync(() => {
//         let originalWasCalled = false;
//         const headerBarMock: HeaderBarMock = {
//             getBack: () => {
//                 return;
//             },
//             backUrl: '/home',
//         };

//         spyOn(headerBarMock, 'getBack');

//         component.handleBackAction(headerBarMock, () => (originalWasCalled = true));

//         headerBarMock.getBack();
//         tick();

//         expect(gameServiceMock.confirmAndAbandonGame).toHaveBeenCalledWith('testUser');

//         expect(originalWasCalled).toBeTrue();
//         flush();
//     }));

//     it('should override headerBar.getBack and NOT call original method if not confirmed', fakeAsync(() => {
//         gameServiceMock.confirmAndAbandonGame.and.returnValue(Promise.resolve(false));

//         let originalWasCalled = false;

//         const headerBarMock: HeaderBarMock = {
//             getBack: () => {
//                 originalWasCalled = true;
//             },
//             backUrl: '/home',
//         };

//         component.handleBackAction(headerBarMock);
//         headerBarMock.getBack();
//         tick();

//         expect(gameServiceMock.confirmAndAbandonGame).toHaveBeenCalledWith('testUser');

//         expect(originalWasCalled).toBeFalse();
//         flush();
//     }));
// });
