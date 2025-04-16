/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_FILE_TYPE } from '@app/constants/path';
import { PlayerService } from '@app/services/player/player.service';
import { IPlayer } from '@common/player';
import { BehaviorSubject, Subscription } from 'rxjs';
import { GameMapPlayerDetailedComponent } from './game-map-player-detailed.component';

describe('GameMapPlayerDetailedComponent', () => {
    let component: GameMapPlayerDetailedComponent;
    let fixture: ComponentFixture<GameMapPlayerDetailedComponent>;
    let playerServiceMock: jasmine.SpyObj<PlayerService>;
    let myPlayerSubject: BehaviorSubject<IPlayer | null>;
    let unsubscribeSpy: jasmine.Spy;

    const mockPlayer = {
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
    } as IPlayer;

    beforeEach(async () => {
        myPlayerSubject = new BehaviorSubject<IPlayer | null>(mockPlayer);
        unsubscribeSpy = jasmine.createSpy('unsubscribe');

        spyOn(Subscription.prototype, 'unsubscribe').and.callFake(() => {
            unsubscribeSpy();
            return undefined;
        });

        playerServiceMock = jasmine.createSpyObj('PlayerService', [], {
            myPlayer: myPlayerSubject.asObservable(),
        });

        await TestBed.configureTestingModule({
            imports: [CommonModule, GameMapPlayerDetailedComponent],
            providers: [{ provide: PlayerService, useValue: playerServiceMock }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameMapPlayerDetailedComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with constant paths', () => {
        expect(component.fileType).toBe(DEFAULT_FILE_TYPE);
    });

    it('should initialize myPlayer and maxHealth during ngOnInit', () => {
        expect(component.myPlayer).toEqual(mockPlayer);
        expect(component.maxHealth).toBe(mockPlayer.life);
    });

    it('should update myPlayer and maxHealth when myPlayer$ emits a new value', () => {
        const updatedPlayer: IPlayer = { ...mockPlayer, life: 80 };
        myPlayerSubject.next(updatedPlayer);
        fixture.detectChanges();
        expect(component.myPlayer).toEqual(updatedPlayer);
        expect(component.maxHealth).toBe(updatedPlayer.life);
    });

    it('should handle case where player is undefined during initialization', async () => {
        const emptyPlayerSubject = new BehaviorSubject<IPlayer | null>(null);
        const newPlayerServiceMock = jasmine.createSpyObj('PlayerService', [], {
            myPlayer: emptyPlayerSubject.asObservable(),
        });

        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [CommonModule, GameMapPlayerDetailedComponent],
            providers: [{ provide: PlayerService, useValue: newPlayerServiceMock }],
        }).compileComponents();

        const newFixture = TestBed.createComponent(GameMapPlayerDetailedComponent);
        newFixture.detectChanges();
        const newComponent = newFixture.componentInstance;
        expect(newComponent.myPlayer).toBeNull();
        expect(newComponent.maxHealth).toBe(0);
    });

    it('should update maxHealth when a valid player is emitted', () => {
        const updatedPlayer: IPlayer = { ...mockPlayer, life: 75 };
        myPlayerSubject.next(updatedPlayer);
        fixture.detectChanges();
        expect(component.myPlayer).toEqual(updatedPlayer);
        expect(component.maxHealth).toBe(75);
    });
});
