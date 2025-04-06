/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameMapInfoComponent } from '@app/components/game/game-map-info/game-map-info.component';
import { GameService } from '@app/services/game/game.service';
import { IPlayer } from '@common/player';
import { BehaviorSubject } from 'rxjs';

describe('GameMapInfoComponent', () => {
    let component: GameMapInfoComponent;
    let fixture: ComponentFixture<GameMapInfoComponent>;
    let gameServiceMock: jasmine.SpyObj<GameService>;

    let activePlayerSubject: BehaviorSubject<IPlayer | null>;
    let currentPlayersSubject: BehaviorSubject<IPlayer[]>;
    let mapSubject: BehaviorSubject<{ length: number }>;

    beforeEach(async () => {
        activePlayerSubject = new BehaviorSubject<IPlayer | null>(null);
        currentPlayersSubject = new BehaviorSubject<IPlayer[]>([]);
        mapSubject = new BehaviorSubject<{ length: number }>({ length: 10 });

        gameServiceMock = jasmine.createSpyObj('GameService', [], {
            activePlayer: activePlayerSubject.asObservable(),
            playingPlayers: currentPlayersSubject.asObservable(),
            map: mapSubject.asObservable(),
        });

        await TestBed.configureTestingModule({
            imports: [CommonModule, GameMapInfoComponent],
            providers: [{ provide: GameService, useValue: gameServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameMapInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.mapSize).toBe(10);
        expect(component.activePlayer).toBeNull();
        expect(component.playerCount).toBe(0);
    });

    it('should update map size when map$ emits a new value', () => {
        mapSubject.next({ length: 15 });
        fixture.detectChanges();
        expect(component.mapSize).toBe(15);
    });

    it('should update active player when activePlayer$ emits a new value', () => {
        const testPlayer: IPlayer = {
            id: '1',
            name: 'testUser',
            avatar: '1',
            life: 100,
            attackPower: 10,
            defensePower: 10,
            speed: 5,
            attackDice: 'D6',
            defenseDice: 'D4',
            movementPts: 5,
            actions: 2,
            wins: 0,
            position: { x: 0, y: 0 },
            spawnPosition: { x: 0, y: 0 },
            fleeAttempts: 2,
            currentLife: 100,
            diceResult: 0,
        };

        activePlayerSubject.next(testPlayer);
        fixture.detectChanges();
        expect(component.activePlayer).toEqual(testPlayer);
    });

    it('should update player count when currentPlayers$ emits a new list', () => {
        const players: IPlayer[] = [
            {
                id: '1',
                name: 'Player1',
                avatar: '1',
                life: 100,
                attackPower: 10,
                defensePower: 10,
                speed: 5,
                attackDice: 'D6',
                defenseDice: 'D4',
                movementPts: 5,
                actions: 2,
                wins: 0,
                position: { x: 0, y: 0 },
                spawnPosition: { x: 0, y: 0 },
                fleeAttempts: 2,
                currentLife: 100,
                diceResult: 0,
            },
            {
                id: '2',
                name: 'Player2',
                avatar: '1',
                life: 100,
                attackPower: 10,
                defensePower: 10,
                speed: 5,
                attackDice: 'D6',
                defenseDice: 'D4',
                movementPts: 5,
                actions: 2,
                wins: 0,
                position: { x: 0, y: 0 },
                spawnPosition: { x: 0, y: 0 },
                fleeAttempts: 2,
                currentLife: 100,
                diceResult: 0,
            },
        ];

        currentPlayersSubject.next(players);
        fixture.detectChanges();
        expect(component.playerCount).toBe(2);
    });

    it('should update player count to zero when currentPlayers$ emits an empty list', () => {
        currentPlayersSubject.next([]);
        fixture.detectChanges();
        expect(component.playerCount).toBe(0);
    });
});
