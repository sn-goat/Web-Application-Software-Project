/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameMapService } from '@app/services/code/game-map.service';
import { GameService } from '@app/services/code/game.service';
import { PlayerService } from '@app/services/code/player.service';
import { BehaviorSubject } from 'rxjs';
import { GameMapInfoComponent } from '@app/components/game/game-map-info/game-map-info.component';

describe('GameMapInfoComponent', () => {
    let component: GameMapInfoComponent;
    let fixture: ComponentFixture<GameMapInfoComponent>;
    let gameMapServiceMock: jasmine.SpyObj<GameMapService>;
    let playerServiceMock: jasmine.SpyObj<PlayerService>;
    let gameServiceMock: jasmine.SpyObj<GameService>;
    let activePlayerSubject: BehaviorSubject<string>;
    let playersInGameSubject: BehaviorSubject<Map<string, boolean>>;

    beforeEach(async () => {
        activePlayerSubject = new BehaviorSubject<string>('');
        playersInGameSubject = new BehaviorSubject<Map<string, boolean>>(new Map());

        gameMapServiceMock = jasmine.createSpyObj('GameMapService', ['getGameMapSize']);
        gameMapServiceMock.getGameMapSize.and.returnValue(10);

        playerServiceMock = jasmine.createSpyObj('PlayerService', [], {
            activePlayer$: activePlayerSubject.asObservable(),
        });

        gameServiceMock = jasmine.createSpyObj('GameService', [], {
            playersInGameMap$: playersInGameSubject.asObservable(),
        });

        await TestBed.configureTestingModule({
            imports: [CommonModule, GameMapInfoComponent],
            providers: [
                { provide: GameMapService, useValue: gameMapServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
                { provide: GameService, useValue: gameServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values and get map size from service', () => {
        expect(component.mapSize).toBe(10);
        expect(component.activePlayer).toBe('');
        expect(component.playerCount).toBe(0);
        expect(gameMapServiceMock.getGameMapSize).toHaveBeenCalled();
    });

    it('should update activePlayer when activePlayer$ emits', () => {
        expect(component.activePlayer).toBe('');

        activePlayerSubject.next('player1');
        expect(component.activePlayer).toBe('player1');

        activePlayerSubject.next('player2');
        expect(component.activePlayer).toBe('player2');
    });

    it('should update playerCount when playersInGameMap$ emits an empty map', () => {
        expect(component.playerCount).toBe(0);

        playersInGameSubject.next(new Map());
        expect(component.playerCount).toBe(0);
    });

    it('should update playerCount when playersInGameMap$ emits a map with some active players', () => {
        const playersMap = new Map<string, boolean>([
            ['player1', true],
            ['player2', false],
            ['player3', true],
        ]);

        playersInGameSubject.next(playersMap);
        expect(component.playerCount).toBe(2);
    });

    it('should update playerCount when playersInGameMap$ emits a map with all active players', () => {
        const playersMap = new Map<string, boolean>([
            ['player1', true],
            ['player2', true],
            ['player3', true],
        ]);

        playersInGameSubject.next(playersMap);
        expect(component.playerCount).toBe(3);
    });

    it('should update playerCount when playersInGameMap$ emits a map with no active players', () => {
        const playersMap = new Map<string, boolean>([
            ['player1', false],
            ['player2', false],
            ['player3', false],
        ]);

        playersInGameSubject.next(playersMap);
        expect(component.playerCount).toBe(0);
    });

    it('should handle multiple updates to activePlayer and playersInGameMap', () => {
        activePlayerSubject.next('player1');
        playersInGameSubject.next(new Map([['player1', true]]));

        expect(component.activePlayer).toBe('player1');
        expect(component.playerCount).toBe(1);

        activePlayerSubject.next('player2');
        const newMap = new Map<string, boolean>([
            ['player1', true],
            ['player2', true],
        ]);
        playersInGameSubject.next(newMap);

        expect(component.activePlayer).toBe('player2');
        expect(component.playerCount).toBe(2);
    });

    it('should test different map sizes', () => {
        gameMapServiceMock.getGameMapSize.and.returnValue(20);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [CommonModule, GameMapInfoComponent],
            providers: [
                { provide: GameMapService, useValue: gameMapServiceMock },
                { provide: PlayerService, useValue: playerServiceMock },
                { provide: GameService, useValue: gameServiceMock },
            ],
        });

        const newFixture = TestBed.createComponent(GameMapInfoComponent);
        newFixture.detectChanges();

        expect(newFixture.componentInstance.mapSize).toBe(20);
    });
});
