/* eslint-disable @typescript-eslint/no-magic-numbers */

import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MapListComponent } from '@app/components/map-list/map-list.component';
import { GameMapService } from '@app/services/code/game-map.service';
import { SocketService } from '@app/services/code/socket.service';
import { of } from 'rxjs';
import { FormCharacterComponent } from './form-character.component';

const BASE_STAT = 4;
const UPGRADED_STAT = 6;

describe('FormCharacterComponent', () => {
    let component: FormCharacterComponent;
    let fixture: ComponentFixture<FormCharacterComponent>;
    let mockSocketService: Partial<SocketService>;
    let mockGameMapService: Partial<GameMapService>;

    beforeEach(async () => {
        mockSocketService = {
            gameRoom: { players: [], accessCode: '', organizerId: '', isLocked: false, mapSize: 0 },
            onPlayerJoined: () => of({ room: { players: [], accessCode: '', organizerId: '', isLocked: false, mapSize: 0 } }),
            shareCharacter: jasmine.createSpy('shareCharacter'),
            createRoom: jasmine.createSpy('createRoom'),
            onRoomCreated: jasmine.createSpy('onRoomCreated').and.returnValue(of({ accessCode: '1234' })),
        };

        mockGameMapService = {
            shareGameMap: jasmine.createSpy('shareGameMap'),
            getGameMap: jasmine.createSpy('getGameMap'),
        };

        await TestBed.configureTestingModule({
            imports: [RouterLink, CommonModule, FormsModule, MapListComponent, FormCharacterComponent],
            providers: [
                provideHttpClient(),
                { provide: SocketService, useValue: mockSocketService },
                { provide: GameMapService, useValue: mockGameMapService },
                { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FormCharacterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FormCharacterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate portraits correctly', () => {
        component.currentPortraitIndex = 0;
        component.navigatePortrait('next');
        expect(component.currentPortraitIndex).toBe(1);
        component.navigatePortrait('prev');
        expect(component.currentPortraitIndex).toBe(0);
    });

    it('should select and deselect life', () => {
        component.speedSelected = false;
        component.selectStat('life');
        expect(component.lifeSelected).toBeTrue();
        expect(component.playerStats.life).toBe(UPGRADED_STAT);
        component.selectStat('life');
        expect(component.lifeSelected).toBeFalse();
        expect(component.playerStats.life).toBe(BASE_STAT);
    });

    it('should reset speed when life is selected', () => {
        component.speedSelected = true;
        component.selectStat('life');
        expect(component.speedSelected).toBeFalse();
        expect(component.playerStats.speed).toBe(BASE_STAT);
    });

    it('should select and deselect speed', () => {
        component.lifeSelected = false;
        component.selectStat('speed');
        expect(component.speedSelected).toBeTrue();
        expect(component.playerStats.speed).toBe(UPGRADED_STAT);
        component.selectStat('speed');
        expect(component.speedSelected).toBeFalse();
        expect(component.playerStats.speed).toBe(BASE_STAT);
    });

    it('should reset life when speed is selected', () => {
        component.lifeSelected = true;
        component.selectStat('speed');
        expect(component.lifeSelected).toBeFalse();
        expect(component.playerStats.life).toBe(BASE_STAT);
    });

    it('should select and deselect attack', () => {
        component.defenseSelected = false;
        component.selectCombatStat('attack');
        expect(component.attackSelected).toBeTrue();
        expect(component.playerStats.attackDice).toBe('D6');
        component.selectCombatStat('attack');
        expect(component.attackSelected).toBeFalse();
        expect(component.playerStats.attackDice).toBe('D4');
    });

    it('should reset defense when attack is selected', () => {
        component.defenseSelected = true;
        component.selectCombatStat('attack');
        expect(component.defenseSelected).toBeFalse();
        expect(component.playerStats.defenseDice).toBe('D4');
    });

    it('should select and deselect defense', () => {
        component.attackSelected = false;
        component.selectCombatStat('defense');
        expect(component.defenseSelected).toBeTrue();
        expect(component.playerStats.defenseDice).toBe('D6');
        component.selectCombatStat('defense');
        expect(component.defenseSelected).toBeFalse();
        expect(component.playerStats.defenseDice).toBe('D4');
    });

    it('should reset attack when defense is selected', () => {
        component.attackSelected = true;
        component.selectCombatStat('defense');
        expect(component.attackSelected).toBeFalse();
        expect(component.playerStats.attackDice).toBe('D4');
    });

    it('should return correct portrait image', () => {
        component.currentPortraitIndex = 0;
        expect(component.getCurrentPortraitImage()).toBe('./assets/portraits/portrait1.png');
        component.currentPortraitIndex = 5;
        expect(component.getCurrentPortraitImage()).toBe('./assets/portraits/portrait6.png');
    });

    it('should return true if two playerStats are selected and name is entered', () => {
        component.playerStats.name = 'Test Player';
        component.lifeSelected = true;
        component.speedSelected = true;
        expect(component.canJoin()).toBeTrue();
    });

    it('should return false if less than two playerStats are selected or name is not entered', () => {
        component.playerStats.name = '';
        component.lifeSelected = true;
        component.speedSelected = true;
        expect(component.canJoin()).toBeFalse();

        component.playerStats.name = 'Test Player';
        component.lifeSelected = true;
        component.speedSelected = false;
        expect(component.canJoin()).toBeFalse();
    });

    it('should emit closePopup event when onClose is called', () => {
        spyOn(component.closePopup, 'emit');
        component.onClose();
        expect(component.closePopup.emit).toHaveBeenCalled();
    });

    it('should update currentPortraitIndex and playerStats.avatar when navigating to next portrait', () => {
        component.currentPortraitIndex = 0;
        component.navigatePortrait('next');
        expect(component.currentPortraitIndex).toBe(1);
        expect(component.playerStats.avatar).toBe(`./assets/portraits/portrait${1 + 1}.png`);
    });

    it('should update currentPortraitIndex and playerStats.avatar when navigating to previous portrait', () => {
        component.currentPortraitIndex = 0;
        component.totalPortraits = 5;
        component.navigatePortrait('prev');
        expect(component.currentPortraitIndex).toBe(4);
        expect(component.playerStats.avatar).toBe(`./assets/portraits/portrait${4 + 1}.png`);
    });

    it('should select "life" stat correctly and update stat value', () => {
        component.playerStats.life = BASE_STAT;
        component.speedSelected = false;
        component.lifeSelected = false;

        component.selectStat('life');
        expect(component.lifeSelected).toBeTrue();
        expect(component.playerStats.life).toBe(UPGRADED_STAT);

        component.selectStat('life');
        expect(component.lifeSelected).toBeFalse();
        expect(component.playerStats.life).toBe(BASE_STAT);
    });

    it('should select "speed" stat correctly and update stat value', () => {
        component.playerStats.speed = BASE_STAT;
        component.lifeSelected = false;
        component.speedSelected = false;

        component.selectStat('speed');
        expect(component.speedSelected).toBeTrue();
        expect(component.playerStats.speed).toBe(UPGRADED_STAT);

        component.selectStat('speed');
        expect(component.speedSelected).toBeFalse();
        expect(component.playerStats.speed).toBe(BASE_STAT);
    });

    it('should reset the other stat if one stat is selected while the other is active', () => {
        component.lifeSelected = true;
        component.playerStats.life = UPGRADED_STAT;
        component.speedSelected = false;
        component.selectStat('speed');
        expect(component.speedSelected).toBeTrue();
        expect(component.lifeSelected).toBeFalse();
        expect(component.playerStats.life).toBe(BASE_STAT);
        expect(component.playerStats.speed).toBe(UPGRADED_STAT);
    });

    it('should toggle combat stat "attack": select and deselect correctly', () => {
        component.attackSelected = false;
        component.playerStats.attackDice = 'D4';
        component.playerStats.defenseDice = 'D4';
        component.selectCombatStat('attack');
        expect(component.attackSelected).toBeTrue();
        expect(component.playerStats.attackDice).toBe('D6');

        component.selectCombatStat('attack');
        expect(component.attackSelected).toBeFalse();
        expect(component.playerStats.attackDice).toBe('D4');
        expect(component.playerStats.defenseDice).toBe('D4');
    });

    it('should reset combat stat "defense" when "attack" is selected', () => {
        component.defenseSelected = true;
        component.playerStats.defenseDice = 'D6';
        component.selectCombatStat('attack');
        expect(component.defenseSelected).toBeFalse();
        expect(component.playerStats.defenseDice).toBe('D4');
    });

    it('should toggle combat stat "defense": select and deselect correctly', () => {
        component.defenseSelected = false;
        component.playerStats.defenseDice = 'D4';
        component.playerStats.attackDice = 'D4';
        component.selectCombatStat('defense');
        expect(component.defenseSelected).toBeTrue();
        expect(component.playerStats.defenseDice).toBe('D6');

        component.selectCombatStat('defense');
        expect(component.defenseSelected).toBeFalse();
        expect(component.playerStats.defenseDice).toBe('D4');
        expect(component.playerStats.attackDice).toBe('D4');
    });

    it('should reset combat stat "attack" when "defense" is selected', () => {
        component.attackSelected = true;
        component.playerStats.attackDice = 'D6';
        component.selectCombatStat('defense');
        expect(component.attackSelected).toBeFalse();
        expect(component.playerStats.attackDice).toBe('D4');
    });

    it('should create a game, share the character and navigate to lobby', () => {
        (mockGameMapService.getGameMap as jasmine.Spy).and.returnValue(of({ size: 10 }));
        component.playerStats.id = 'player1';

        component.createGame();
        fixture.detectChanges();

        expect(mockGameMapService.getGameMap).toHaveBeenCalled();
        expect(mockSocketService.createRoom).toHaveBeenCalledWith('player1', 10);
        expect(mockSocketService.onRoomCreated).toHaveBeenCalled();
        expect(mockSocketService.shareCharacter).toHaveBeenCalledWith(
            '1234',
            jasmine.objectContaining({
                id: 'player1',
                name: '',
                avatar: './assets/portraits/portrait1.png',
                life: 4,
                attack: 4,
                defense: 4,
                speed: 4,
                attackDice: 'D4',
                defenseDice: 'D4',
                wins: 0,
            }),
        );
        expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/lobby'], { state: { accessCode: '1234' } });
    });

    it('should call gameMapService.shareRoomMap when shareRoomMap is invoked', () => {
        component.shareGameMap();
        expect(mockGameMapService.shareGameMap).toHaveBeenCalled();
    });

    it('should call socketService.shareCharacter with correct parameters when shareCharacter is invoked', () => {
        // On prépare des valeurs de test pour accessCode et playerStats
        component.accessCode = 'testCode';
        component.playerStats = {
            id: 'player123',
            name: 'TestName',
            avatar: './assets/portraits/portrait1.png',
            life: 4,
            attack: 4,
            defense: 4,
            speed: 4,
            attackDice: 'D4',
            defenseDice: 'D4',
            movementPts: 4,
            actions: 4,
            wins: 0,
        };

        component.shareCharacter();

        expect(mockSocketService.shareCharacter).toHaveBeenCalledWith('testCode', component.playerStats);
    });
});
