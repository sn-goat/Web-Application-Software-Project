// /* eslint-disable @typescript-eslint/no-magic-numbers */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { CommonModule } from '@angular/common';
// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { DEFAULT_FILE_TYPE, DEFAULT_PATH_AVATARS, DEFAULT_PATH_DICE } from '@app/constants/path';
// import { GameService } from '@app/services/code/game.service';
// import { PlayerStats } from '@common/player';
// import { BehaviorSubject, Subscription } from 'rxjs';
// import { GameMapPlayerDetailedComponent } from './game-map-player-detailed.component';

// describe('GameMapPlayerDetailedComponent', () => {
//     let component: GameMapPlayerDetailedComponent;
//     let fixture: ComponentFixture<GameMapPlayerDetailedComponent>;
//     let gameServiceMock: jasmine.SpyObj<GameService>;
//     let clientPlayerSubject: BehaviorSubject<PlayerStats | undefined>;
//     let unsubscribeSpy: jasmine.Spy;

//     const mockPlayer: PlayerStats = {
//         id: '1',
//         name: 'testUser',
//         avatar: '1',
//         life: 100,
//         attack: 10,
//         defense: 10,
//         speed: 5,
//         attackDice: 'D6',
//         defenseDice: 'D4',
//         movementPts: 5,
//         actions: 2,
//         wins: 0,
//         position: { x: 0, y: 0 },
//         spawnPosition: { x: 0, y: 0 },
//     };

//     beforeEach(async () => {
//         clientPlayerSubject = new BehaviorSubject<PlayerStats | undefined>(mockPlayer);
//         unsubscribeSpy = jasmine.createSpy('unsubscribe');

//         spyOn(Subscription.prototype, 'unsubscribe').and.callFake(() => {
//             unsubscribeSpy();
//             return undefined;
//         });

//         gameServiceMock = jasmine.createSpyObj('GameService', [], {
//             clientPlayer$: clientPlayerSubject.asObservable(),
//         });

//         await TestBed.configureTestingModule({
//             imports: [CommonModule, GameMapPlayerDetailedComponent],
//             providers: [{ provide: GameService, useValue: gameServiceMock }],
//         }).compileComponents();
//     });

//     beforeEach(() => {
//         fixture = TestBed.createComponent(GameMapPlayerDetailedComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should initialize with constant paths', () => {
//         expect(component.srcAvatar).toBe(DEFAULT_PATH_AVATARS);
//         expect(component.srcDice).toBe(DEFAULT_PATH_DICE);
//         expect(component.fileType).toBe(DEFAULT_FILE_TYPE);
//     });

//     it('should initialize myPlayer and maxHealth during ngOnInit', () => {
//         expect(component.myPlayer).toEqual(mockPlayer);
//         expect(component.maxHealth).toBe(mockPlayer.life);
//     });

//     it('should update myPlayer and maxHealth when clientPlayer$ emits a new value', () => {
//         const updatedPlayer: PlayerStats = { ...mockPlayer, life: 80 };

//         clientPlayerSubject.next(updatedPlayer);

//         expect(component.myPlayer).toEqual(updatedPlayer);
//         expect(component.maxHealth).toBe(updatedPlayer.life);
//     });

//     it('should handle undefined player from clientPlayer$', () => {
//         clientPlayerSubject.next(undefined);

//         expect(component.myPlayer).toBeUndefined();
//         expect(component.maxHealth).toBe(mockPlayer.life);
//     });

//     it('should return "health-hight" from getHealthBar method', () => {
//         expect(component.getHealthBar()).toBe('health-hight');
//     });

//     it('should round health correctly', () => {
//         expect(component.roundHealth(10.4)).toBe(10);
//         expect(component.roundHealth(10.5)).toBe(11);
//         expect(component.roundHealth(10.9)).toBe(11);
//         expect(component.roundHealth(0)).toBe(0);
//         expect(component.roundHealth(-5.5)).toBe(-5);
//     });

//     it('should handle case where player is undefined during initialization', () => {
//         const emptyPlayerSubject = new BehaviorSubject<PlayerStats | undefined>(undefined);
//         const newGameServiceMock = jasmine.createSpyObj('GameService', [], {
//             clientPlayer$: emptyPlayerSubject.asObservable(),
//         });

//         TestBed.resetTestingModule();
//         TestBed.configureTestingModule({
//             imports: [CommonModule, GameMapPlayerDetailedComponent],
//             providers: [{ provide: GameService, useValue: newGameServiceMock }],
//         });

//         const newFixture = TestBed.createComponent(GameMapPlayerDetailedComponent);
//         newFixture.detectChanges();

//         expect(newFixture.componentInstance.myPlayer).toBeUndefined();
//         expect(newFixture.componentInstance.maxHealth).toBe(0);
//     });
// });
