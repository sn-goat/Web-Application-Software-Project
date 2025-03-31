// /* eslint-disable @typescript-eslint/no-magic-numbers */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { CommonModule } from '@angular/common';
// import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
// import { DEFAULT_FILE_TYPE, DEFAULT_PATH_AVATARS } from '@app/constants/path';
// import { GameService } from '@app/services/game/game.service';
// import { SocketService } from '@app/services/socket/socket.service';
// import { PlayerStats } from '@common/player';
// import { BehaviorSubject, Subscription, of } from 'rxjs';
// import { GameMapPlayerComponent } from './game-map-player.component';

// describe('GameMapPlayerComponent', () => {
//     let component: GameMapPlayerComponent;
//     let fixture: ComponentFixture<GameMapPlayerComponent>;
//     let gameServiceMock: any;
//     let socketServiceMock: any;
//     let currentPlayersSubject: BehaviorSubject<PlayerStats[]>;
//     let initialPlayersSubject: BehaviorSubject<PlayerStats[]>;
//     let activePlayerSubject: BehaviorSubject<PlayerStats | null>;
//     let unsubscribeSpy: jasmine.Spy;

//     const mockPlayers: PlayerStats[] = [
//         {
//             id: '1',
//             name: 'player1',
//             avatar: '1',
//             life: 100,
//             attack: 10,
//             defense: 10,
//             speed: 5,
//             attackDice: 'D6',
//             defenseDice: 'D4',
//             movementPts: 5,
//             actions: 2,
//             wins: 0,
//             position: { x: 0, y: 0 },
//             spawnPosition: { x: 0, y: 0 },
//         },
//         {
//             id: '2',
//             name: 'player2',
//             avatar: '2',
//             life: 90,
//             attack: 12,
//             defense: 8,
//             speed: 7,
//             attackDice: 'D6',
//             defenseDice: 'D4',
//             movementPts: 4,
//             actions: 1,
//             wins: 0,
//             position: { x: 0, y: 0 },
//             spawnPosition: { x: 0, y: 0 },
//         },
//     ];

//     const mockActivePlayer: PlayerStats = mockPlayers[0];

//     beforeEach(async () => {
//         currentPlayersSubject = new BehaviorSubject<PlayerStats[]>([]);
//         initialPlayersSubject = new BehaviorSubject<PlayerStats[]>([]);
//         activePlayerSubject = new BehaviorSubject<PlayerStats | null>(null);

//         unsubscribeSpy = jasmine.createSpy('unsubscribe');

//         gameServiceMock = {
//             playingPlayers: currentPlayersSubject.asObservable(),
//             initialPlayers: initialPlayersSubject.asObservable(),
//             activePlayer: activePlayerSubject.asObservable(),
//             getOrganizerId: () => 'organizer1',
//         };

//         socketServiceMock = jasmine.createSpyObj('SocketService', ['onWinner', 'resetSocketState']);
//         socketServiceMock.onWinner.and.returnValue(of(mockPlayers[0]));

//         spyOn(Subscription.prototype, 'unsubscribe').and.callFake(() => {
//             unsubscribeSpy();
//             return undefined;
//         });

//         await TestBed.configureTestingModule({
//             imports: [CommonModule, GameMapPlayerComponent],
//             providers: [
//                 { provide: GameService, useValue: gameServiceMock },
//                 { provide: SocketService, useValue: socketServiceMock },
//             ],
//         }).compileComponents();

//         fixture = TestBed.createComponent(GameMapPlayerComponent);
//         component = fixture.componentInstance;

//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should initialize with constant paths', () => {
//         expect(component.srcAvatar).toBe(DEFAULT_PATH_AVATARS);
//         expect(component.fileType).toBe(DEFAULT_FILE_TYPE);
//     });

//     it('should update activePlayer when activePlayer$ emits', fakeAsync(() => {
//         activePlayerSubject.next(mockActivePlayer);
//         tick();
//         fixture.detectChanges();
//         expect(component.activePlayer).toEqual(mockActivePlayer);
//     }));
// });
