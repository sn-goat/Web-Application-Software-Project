/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_AVATARS } from '@app/constants/path';
import { GameService } from '@app/services/code/game.service';
import { PlayerStats } from '@common/player';
import { BehaviorSubject, Subscription } from 'rxjs';
import { GameMapPlayerComponent } from './game-map-player.component';

describe('GameMapPlayerComponent', () => {
    let component: GameMapPlayerComponent;
    let fixture: ComponentFixture<GameMapPlayerComponent>;
    let gameServiceMock: jasmine.SpyObj<GameService>;
    let currentPlayersSubject: BehaviorSubject<PlayerStats[]>;
    let activePlayerSubject: BehaviorSubject<PlayerStats | null>;
    let unsubscribeSpy: jasmine.Spy;

    const mockPlayers: PlayerStats[] = [
        {
            id: '1',
            name: 'player1',
            avatar: '1',
            life: 100,
            attack: 10,
            defense: 10,
            speed: 5,
            attackDice: 'D6',
            defenseDice: 'D4',
            movementPts: 5,
            actions: 2,
            wins: 0,
            position: { x: 0, y: 0 },
            spawnPosition: { x: 0, y: 0 },
        },
        {
            id: '2',
            name: 'player2',
            avatar: '2',
            life: 90,
            attack: 12,
            defense: 8,
            speed: 7,
            attackDice: 'D6',
            defenseDice: 'D4',
            movementPts: 4,
            actions: 1,
            wins: 0,
            position: { x: 0, y: 0 },
            spawnPosition: { x: 0, y: 0 },
        },
    ];

    const mockActivePlayer: PlayerStats = mockPlayers[0];

    beforeEach(async () => {
        currentPlayersSubject = new BehaviorSubject<PlayerStats[]>([]);
        activePlayerSubject = new BehaviorSubject<PlayerStats | null>(null);

        unsubscribeSpy = jasmine.createSpy('unsubscribe');

        gameServiceMock = jasmine.createSpyObj('GameService', [], {
            currentPlayers$: currentPlayersSubject.asObservable(),
            activePlayer$: activePlayerSubject.asObservable(),
        });

        spyOn(Subscription.prototype, 'unsubscribe').and.callFake(() => {
            unsubscribeSpy();
            return undefined;
        });

        await TestBed.configureTestingModule({
            imports: [CommonModule, GameMapPlayerComponent],
            providers: [{ provide: GameService, useValue: gameServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapPlayerComponent);
        component = fixture.componentInstance;

        component.gameService = gameServiceMock;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with constant paths', () => {
        expect(component.srcAvatar).toBe(DEFAULT_PATH_AVATARS);
        expect(component.fileType).toBe(DEFAULT_FILE_TYPE);
    });

    it('should update players when currentPlayers$ emits', () => {
        currentPlayersSubject.next(mockPlayers);

        expect(component.players).toEqual(mockPlayers);
    });

    it('should update activePlayer when activePlayer$ emits', () => {
        activePlayerSubject.next(mockActivePlayer);

        expect(component.activePlayer).toEqual(mockActivePlayer);
    });

    it('should handle empty arrays from currentPlayers$', () => {
        component.players = mockPlayers;

        currentPlayersSubject.next([]);

        expect(component.players).toEqual([]);
    });

    it('should handle null activePlayer', () => {
        component.activePlayer = mockActivePlayer;

        activePlayerSubject.next(null);

        expect(component.activePlayer).toBeNull();
    });

    it('should handle undefined data from currentPlayers$', () => {
        currentPlayersSubject.next(undefined as unknown as PlayerStats[]);

        expect(component.players).toEqual(undefined as unknown as PlayerStats[]);
    });
});
