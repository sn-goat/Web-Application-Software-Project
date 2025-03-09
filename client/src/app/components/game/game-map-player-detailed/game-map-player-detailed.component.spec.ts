/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HEALTH_HIGH_THRESHOLD, HEALTH_MAX, HEALTH_MEDIUM_THRESHOLD } from '@app/constants/health';
import { DEFAULT_FILE_TYPE, DEFAULT_PATH_AVATARS, DEFAULT_PATH_DICE } from '@app/constants/path';
import { PlayerService } from '@app/services/code/player.service';
import { PlayerStats } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { GameMapPlayerDetailedComponent } from './game-map-player-detailed.component';

describe('GameMapPlayerDetailedComponent', () => {
    let component: GameMapPlayerDetailedComponent;
    let fixture: ComponentFixture<GameMapPlayerDetailedComponent>;
    let playerServiceMock: jasmine.SpyObj<PlayerService>;
    let playersSubject: BehaviorSubject<PlayerStats[]>;

    const mockPlayer: PlayerStats = {
        id: '1',
        name: 'testUser',
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
    };

    beforeEach(async () => {
        playersSubject = new BehaviorSubject<PlayerStats[]>([mockPlayer]);

        playerServiceMock = jasmine.createSpyObj('PlayerService', ['getPlayer', 'getPlayerName']);
        playerServiceMock.players$ = playersSubject.asObservable();
        playerServiceMock.getPlayerName.and.returnValue('testUser');
        playerServiceMock.getPlayer.and.returnValue(mockPlayer);

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
        expect(component.srcAvatar).toBe(DEFAULT_PATH_AVATARS);
        expect(component.srcDice).toBe(DEFAULT_PATH_DICE);
        expect(component.fileType).toBe(DEFAULT_FILE_TYPE);
    });

    it('should initialize player from PlayerService', () => {
        expect(component.player).toEqual(mockPlayer);
        expect(component.maxHealth).toBe(mockPlayer.life);
        expect(playerServiceMock.getPlayer).toHaveBeenCalledWith('testUser');
    });

    it('should update player when players$ emits', () => {
        const updatedPlayer: PlayerStats = { ...mockPlayer, life: 80 };
        playerServiceMock.getPlayer.and.returnValue(updatedPlayer);

        playersSubject.next([updatedPlayer]);

        expect(component.player).toEqual(updatedPlayer);
    });

    it('should not update player if getPlayer returns undefined', () => {
        component.player = mockPlayer;
        playerServiceMock.getPlayer.and.returnValue(undefined);

        playersSubject.next([]);

        expect(component.player).toEqual(mockPlayer);
    });

    it('should handle case where getPlayer returns undefined during initialization', () => {
        playerServiceMock.getPlayer.and.returnValue(undefined);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [CommonModule, GameMapPlayerDetailedComponent],
            providers: [{ provide: PlayerService, useValue: playerServiceMock }],
        });

        const undefinedFixture = TestBed.createComponent(GameMapPlayerDetailedComponent);
        const undefinedComponent = undefinedFixture.componentInstance;

        undefinedFixture.detectChanges();

        expect(undefinedComponent.maxHealth).toBe(0);
    });

    it('should correctly calculate health bar class when health is high', () => {
        component.player = { ...mockPlayer, life: 90 };
        component.maxHealth = 100;

        expect(component.getHealthBar()).toBe('health-high');
    });

    it('should correctly calculate health bar class when health is medium', () => {
        component.player = { ...mockPlayer, life: 60 };
        component.maxHealth = 100;

        expect(component.getHealthBar()).toBe('health-medium');
    });

    it('should correctly calculate health bar class when health is low', () => {
        component.player = { ...mockPlayer, life: 20 };
        component.maxHealth = 100;

        expect(component.getHealthBar()).toBe('health-low');
    });

    it('should round health correctly', () => {
        expect(component.roundHealth(10.4)).toBe(10);
        expect(component.roundHealth(10.5)).toBe(11);
        expect(component.roundHealth(10.9)).toBe(11);
    });

    it('should handle health percentage calculation correctly', () => {
        component.player = { ...mockPlayer, life: 75 };
        component.maxHealth = 150;

        const expectedHealthPercentage = Math.round((75 / 150) * HEALTH_MAX);

        spyOn(component, 'roundHealth').and.callThrough();
        component.getHealthBar();

        expect(component.roundHealth).toHaveBeenCalledWith((75 / 150) * HEALTH_MAX);

        if (expectedHealthPercentage > HEALTH_HIGH_THRESHOLD) {
            expect(component.getHealthBar()).toBe('health-high');
        } else if (expectedHealthPercentage > HEALTH_MEDIUM_THRESHOLD) {
            expect(component.getHealthBar()).toBe('health-medium');
        } else {
            expect(component.getHealthBar()).toBe('health-low');
        }
    });

    it('should handle zero maxHealth in health calculation', () => {
        component.player = { ...mockPlayer, life: 50 };
        component.maxHealth = 0;

        spyOn(component, 'roundHealth').and.callThrough();

        const healthBarClass = component.getHealthBar();

        expect(component.roundHealth).toHaveBeenCalled();

        expect(['health-high', 'health-medium', 'health-low'].includes(healthBarClass)).toBeTrue();
    });
});
