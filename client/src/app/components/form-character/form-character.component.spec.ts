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
import { GameMapService } from '@app/services/code/game-map.service';

const BASE_STAT = 4;
const UPGRADED_STAT = 6;
const D4 = './assets/dice/d4.png';
const D6 = './assets/dice/d6.png';

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
        component.rapiditySelected = false;
        component.selectStat('life');
        expect(component.lifeSelected).toBeTrue();
        expect(component.stats.life).toBe(UPGRADED_STAT);
        component.selectStat('life');
        expect(component.lifeSelected).toBeFalse();
        expect(component.stats.life).toBe(BASE_STAT);
    });

    it('should reset rapidity when life is selected', () => {
        component.rapiditySelected = true;
        component.selectStat('life');
        expect(component.rapiditySelected).toBeFalse();
        expect(component.stats.rapidity).toBe(BASE_STAT);
    });

    it('should select and deselect rapidity', () => {
        component.lifeSelected = false;
        component.selectStat('rapidity');
        expect(component.rapiditySelected).toBeTrue();
        expect(component.stats.rapidity).toBe(UPGRADED_STAT);
        component.selectStat('rapidity');
        expect(component.rapiditySelected).toBeFalse();
        expect(component.stats.rapidity).toBe(BASE_STAT);
    });

    it('should reset life when rapidity is selected', () => {
        component.lifeSelected = true;
        component.selectStat('rapidity');
        expect(component.lifeSelected).toBeFalse();
        expect(component.stats.life).toBe(BASE_STAT);
    });

    it('should select and deselect attack', () => {
        component.defenseSelected = false;
        component.selectCombatStat('attack');
        expect(component.attackSelected).toBeTrue();
        expect(component.stats.attackDice).toBe(D6);
        component.selectCombatStat('attack');
        expect(component.attackSelected).toBeFalse();
        expect(component.stats.attackDice).toBe('');
    });

    it('should reset defense when attack is selected', () => {
        component.defenseSelected = true;
        component.selectCombatStat('attack');
        expect(component.defenseSelected).toBeFalse();
        expect(component.stats.defenseDice).toBe(D4);
    });

    it('should select and deselect defense', () => {
        component.attackSelected = false;
        component.selectCombatStat('defense');
        expect(component.defenseSelected).toBeTrue();
        expect(component.stats.defenseDice).toBe(D6);
        component.selectCombatStat('defense');
        expect(component.defenseSelected).toBeFalse();
        expect(component.stats.defenseDice).toBe('');
    });

    it('should reset attack when defense is selected', () => {
        component.attackSelected = true;
        component.selectCombatStat('defense');
        expect(component.attackSelected).toBeFalse();
        expect(component.stats.attackDice).toBe(D4);
    });

    it('should return correct portrait image', () => {
        component.currentPortraitIndex = 0;
        expect(component.getCurrentPortraitImage()).toBe('./assets/portraits/portrait1.png');
        component.currentPortraitIndex = 5;
        expect(component.getCurrentPortraitImage()).toBe('./assets/portraits/portrait6.png');
    });

    it('should return true if two stats are selected and name is entered', () => {
        component.stats.name = 'Test Player';
        component.lifeSelected = true;
        component.rapiditySelected = true;
        expect(component.canJoin()).toBeTrue();
    });

    it('should return false if less than two stats are selected or name is not entered', () => {
        component.stats.name = '';
        component.lifeSelected = true;
        component.rapiditySelected = true;
        expect(component.canJoin()).toBeFalse();

        component.stats.name = 'Test Player';
        component.lifeSelected = true;
        component.rapiditySelected = false;
        expect(component.canJoin()).toBeFalse();
    });

    it('should emit closePopup event when onClose is called', () => {
        spyOn(component.closePopup, 'emit');
        component.onClose();
        expect(component.closePopup.emit).toHaveBeenCalled();
    });

    // Tests pour navigatePortrait (lignes 59–60)
    it('should update currentPortraitIndex and stats.avatar when navigating to next portrait', () => {
        component.currentPortraitIndex = 0;
        component.navigatePortrait('next');
        expect(component.currentPortraitIndex).toBe(1);
        expect(component.stats.avatar).toBe(`./assets/portraits/portrait${1 + 1}.png`);
    });

    it('should update currentPortraitIndex and stats.avatar when navigating to previous portrait', () => {
        // Si on est sur le premier portrait, passer au dernier
        component.currentPortraitIndex = 0;
        component.totalPortraits = 5;
        component.navigatePortrait('prev');
        expect(component.currentPortraitIndex).toBe(4);
        expect(component.stats.avatar).toBe(`./assets/portraits/portrait${4 + 1}.png`);
    });

    // Tests pour selectStat (lignes 76–148)
    it('should select "life" stat correctly and update stat value', () => {
        // Initial : life = BASE_STAT
        component.stats.life = BASE_STAT;
        // Aucune autre stat sélectionnée
        component.rapiditySelected = false;
        component.lifeSelected = false;

        component.selectStat('life');
        expect(component.lifeSelected).toBeTrue();
        expect(component.stats.life).toBe(UPGRADED_STAT);

        // Désactivation de "life"
        component.selectStat('life');
        expect(component.lifeSelected).toBeFalse();
        expect(component.stats.life).toBe(BASE_STAT);
    });

    it('should select "rapidity" stat correctly and update stat value', () => {
        component.stats.rapidity = BASE_STAT;
        component.lifeSelected = false;
        component.rapiditySelected = false;

        component.selectStat('rapidity');
        expect(component.rapiditySelected).toBeTrue();
        expect(component.stats.rapidity).toBe(UPGRADED_STAT);

        component.selectStat('rapidity');
        expect(component.rapiditySelected).toBeFalse();
        expect(component.stats.rapidity).toBe(BASE_STAT);
    });

    it('should reset the other stat if one stat is selected while the other is active', () => {
        // Imaginons que "life" est déjà sélectionné et upgrade
        component.lifeSelected = true;
        component.stats.life = UPGRADED_STAT;
        // Maintenant, on sélectionne rapidity
        component.rapiditySelected = false; // assurez-vous qu'elle est désactivée
        component.selectStat('rapidity');
        expect(component.rapiditySelected).toBeTrue();
        // Le stat opposé ("life") doit être réinitialisé
        expect(component.lifeSelected).toBeFalse();
        expect(component.stats.life).toBe(BASE_STAT);
        // rapidity doit être augmentée
        expect(component.stats.rapidity).toBe(UPGRADED_STAT);
    });

    // Tests pour selectCombatStat (inclus dans lignes 76–148 si implanté après selectStat)
    it('should toggle combat stat "attack": select and deselect correctly', () => {
        // Cas de sélection
        component.attackSelected = false;
        component.stats.attackDice = '';
        component.stats.defenseDice = '';
        component.selectCombatStat('attack');
        expect(component.attackSelected).toBeTrue();
        expect(component.stats.attackDice).toBe(D6);

        // Cas de désactivation
        component.selectCombatStat('attack');
        expect(component.attackSelected).toBeFalse();
        expect(component.stats.attackDice).toBe('');
        expect(component.stats.defenseDice).toBe('');
    });

    it('should reset combat stat "defense" when "attack" is selected', () => {
        // Préparer : défense sélectionnée et avec image de dé
        component.defenseSelected = true;
        component.stats.defenseDice = D6;
        // Sélectionne attack : cela doit désactiver defense et utiliser D4 pour defense
        component.selectCombatStat('attack');
        expect(component.defenseSelected).toBeFalse();
        expect(component.stats.defenseDice).toBe(D4);
    });

    it('should toggle combat stat "defense": select and deselect correctly', () => {
        component.defenseSelected = false;
        component.stats.defenseDice = '';
        component.stats.attackDice = '';
        component.selectCombatStat('defense');
        expect(component.defenseSelected).toBeTrue();
        expect(component.stats.defenseDice).toBe(D6);

        component.selectCombatStat('defense');
        expect(component.defenseSelected).toBeFalse();
        expect(component.stats.defenseDice).toBe('');
        expect(component.stats.attackDice).toBe('');
    });

    it('should reset combat stat "attack" when "defense" is selected', () => {
        component.attackSelected = true;
        component.stats.attackDice = D6;
        component.selectCombatStat('defense');
        expect(component.attackSelected).toBeFalse();
        expect(component.stats.attackDice).toBe(D4);
    });

    it('should create a game, share the character and navigate to lobby', () => {
        (mockGameMapService.getGameMap as jasmine.Spy).and.returnValue(of({ size: 10 }));
        component.stats.id = 'player1';

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
                rapidity: 4,
                attackDice: '',
                defenseDice: '',
            }),
        );
        expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/lobby'], { state: { accessCode: '1234' } });
    });

    it('should call gameMapService.shareRoomMap when shareRoomMap is invoked', () => {
        component.shareGameMap();
        expect(mockGameMapService.shareGameMap).toHaveBeenCalled();
    });

    it('should call socketService.shareCharacter with correct parameters when shareCharacter is invoked', () => {
        // On prépare des valeurs de test pour accessCode et stats
        component.accessCode = 'testCode';
        component.stats = {
            id: 'player123',
            name: 'TestName',
            avatar: './assets/portraits/portrait1.png',
            life: 4,
            attack: 4,
            defense: 4,
            rapidity: 4,
            attackDice: '',
            defenseDice: '',
        };

        component.shareCharacter();

        expect(mockSocketService.shareCharacter).toHaveBeenCalledWith('testCode', component.stats);
    });
});
