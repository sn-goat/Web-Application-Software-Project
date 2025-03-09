/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_AVATARS } from '@app/constants/path';
import { MAX_PLAYERS } from '@app/constants/playerConst';
import { GameService } from '@app/services/code/game.service';
import { PlayerService } from '@app/services/code/player.service';
import { PlayerStats } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { GameMapPlayerComponent } from './game-map-player.component';

describe('GameMapPlayerComponent', () => {
    let component: GameMapPlayerComponent;
    let fixture: ComponentFixture<GameMapPlayerComponent>;
    let playerServiceMock: jasmine.SpyObj<PlayerService>;
    let gameServiceMock: jasmine.SpyObj<GameService>;
    let playersSubject: BehaviorSubject<PlayerStats[]>;
    let activePlayerSubject: BehaviorSubject<string>;
    let adminSubject: BehaviorSubject<string>;
    let playersWinsSubject: BehaviorSubject<Map<string, number>>;
    let playersInGameSubject: BehaviorSubject<Map<string, boolean>>;

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
        },
        {
            id: '2',
            name: 'player2',
            avatar: '2',
            life: 90,
            attack: 12,
            defense: 8,
            speed: 7,
            attackDice: 'D4',
            defenseDice: 'D6',
            movementPts: 4,
            actions: 2,
            wins: 0,
        },
    ];

    beforeEach(async () => {
        playersSubject = new BehaviorSubject<PlayerStats[]>([]);
        activePlayerSubject = new BehaviorSubject<string>('');
        adminSubject = new BehaviorSubject<string>('');
        playersWinsSubject = new BehaviorSubject<Map<string, number>>(new Map());
        playersInGameSubject = new BehaviorSubject<Map<string, boolean>>(new Map());

        playerServiceMock = jasmine.createSpyObj('PlayerService', ['getPlayer']);
        playerServiceMock.players$ = playersSubject.asObservable();
        playerServiceMock.activePlayer$ = activePlayerSubject.asObservable();
        playerServiceMock.admin$ = adminSubject.asObservable();

        gameServiceMock = jasmine.createSpyObj('GameService', ['updateGameState']);
        gameServiceMock.playersWinsMap$ = playersWinsSubject.asObservable();
        gameServiceMock.playersInGameMap$ = playersInGameSubject.asObservable();

        await TestBed.configureTestingModule({
            imports: [CommonModule, GameMapPlayerComponent],
            providers: [
                { provide: PlayerService, useValue: playerServiceMock },
                { provide: GameService, useValue: gameServiceMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameMapPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with constant paths', () => {
        expect(component.srcAvatar).toBe(DEFAULT_PATH_AVATARS);
        expect(component.fileType).toBe(DEFAULT_FILE_TYPE);
    });

    it('should initialize with empty arrays and default values', () => {
        expect(component.players).toEqual([]);
        expect(component.admin).toBe('');
        expect(component.activePlayer).toBe('');
        expect(component.playersWins).toBeInstanceOf(Map);
        expect(component.playersWins.size).toBe(0);
    });

    it('should update players when players$ emits', () => {
        playersSubject.next(mockPlayers);

        expect(component.players).toEqual(mockPlayers);
    });

    it('should update activePlayer when activePlayer$ emits', () => {
        const activePlayer = 'player1';
        activePlayerSubject.next(activePlayer);

        expect(component.activePlayer).toEqual(activePlayer);
    });

    it('should update admin when admin$ emits', () => {
        const admin = 'player1';
        adminSubject.next(admin);

        expect(component.admin).toEqual(admin);
    });

    it('should update playersWins when playersWinsMap$ emits', () => {
        const winsMap = new Map<string, number>([
            ['player1', 3],
            ['player2', 1],
        ]);
        playersWinsSubject.next(winsMap);

        expect(component.playersWins).toEqual(winsMap);
    });

    it('should update playersInGame when playersInGameMap$ emits', () => {
        const inGameMap = new Map<string, boolean>([
            ['player1', true],
            ['player2', false],
        ]);
        playersInGameSubject.next(inGameMap);

        expect(component.playersInGame).toEqual(inGameMap);
    });

    it('should return correct empty slots count with empty players array', () => {
        component.players = [];

        const emptySlots = component.rangeEmptyPlayerSlot();

        expect(emptySlots.length).toEqual(MAX_PLAYERS);
        expect(emptySlots).toEqual(Array.from({ length: MAX_PLAYERS }, (_, i) => i));
    });

    it('should return correct empty slots count with some players', () => {
        component.players = mockPlayers;

        const emptySlots = component.rangeEmptyPlayerSlot();

        expect(emptySlots.length).toEqual(MAX_PLAYERS - mockPlayers.length);
        expect(emptySlots).toEqual(Array.from({ length: MAX_PLAYERS - mockPlayers.length }, (_, i) => i));
    });

    it('should return empty array when players count equals MAX_PLAYERS', () => {
        component.players = Array(MAX_PLAYERS)
            .fill(null)
            .map((_, i) => ({
                id: i.toString(),
                name: `player${i}`,
                avatar: i.toString(),
                life: 100,
                attack: 10,
                defense: 10,
                speed: 5,
                attackDice: 'D6',
                defenseDice: 'D4',
                movementPts: 5,
                actions: 2,
                wins: 0,
            }));

        const emptySlots = component.rangeEmptyPlayerSlot();

        expect(emptySlots.length).toEqual(0);
        expect(emptySlots).toEqual([]);
    });

    it('should handle undefined players array in players$ subscription', () => {
        playersSubject.next(undefined as unknown as PlayerStats[]);

        expect(component.players).toEqual([]);
    });

    it('should handle multiple emissions from all observables', () => {
        playersSubject.next([mockPlayers[0]]);
        activePlayerSubject.next('player1');
        adminSubject.next('player1');
        playersWinsSubject.next(new Map([['player1', 1]]));
        playersInGameSubject.next(new Map([['player1', true]]));

        expect(component.players).toEqual([mockPlayers[0]]);
        expect(component.activePlayer).toBe('player1');
        expect(component.admin).toBe('player1');
        expect(component.playersWins).toEqual(new Map([['player1', 1]]));
        expect(component.playersInGame).toEqual(new Map([['player1', true]]));

        playersSubject.next(mockPlayers);
        activePlayerSubject.next('player2');
        adminSubject.next('player2');
        playersWinsSubject.next(
            new Map([
                ['player1', 1],
                ['player2', 2],
            ]),
        );
        playersInGameSubject.next(
            new Map([
                ['player1', true],
                ['player2', true],
            ]),
        );

        expect(component.players).toEqual(mockPlayers);
        expect(component.activePlayer).toBe('player2');
        expect(component.admin).toBe('player2');
        expect(component.playersWins).toEqual(
            new Map([
                ['player1', 1],
                ['player2', 2],
            ]),
        );
        expect(component.playersInGame).toEqual(
            new Map([
                ['player1', true],
                ['player2', true],
            ]),
        );
    });
});
