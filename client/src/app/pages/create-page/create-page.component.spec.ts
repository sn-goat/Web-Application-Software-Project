import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MapListComponent } from '@app/components/map-list/map-list.component';
import { CreatePageComponent } from './create-page.component';

const BASE_STAT = 4;
const UPGRADED_STAT = 6;
const D4 = './assets/dice/d4.png';
const D6 = './assets/dice/d6.png';

describe('CreatePageComponent', () => {
    let component: CreatePageComponent;
    let fixture: ComponentFixture<CreatePageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterLink, CommonModule, FormsModule, MapListComponent, CreatePageComponent],
            providers: [provideHttpClient()],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CreatePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open and close popup', () => {
        component.openPopup();
        expect(component.isPopupVisible).toBeTrue();
        component.closePopup();
        expect(component.isPopupVisible).toBeFalse();
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
        expect(component.stats.attackDice).toBe(D4);
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
        expect(component.stats.defenseDice).toBe(D4);
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
        component.playerName = 'Test Player';
        component.lifeSelected = true;
        component.rapiditySelected = true;
        expect(component.canJoin()).toBeTrue();
    });

    it('should return false if less than two stats are selected or name is not entered', () => {
        component.playerName = '';
        component.lifeSelected = true;
        component.rapiditySelected = true;
        expect(component.canJoin()).toBeFalse();

        component.playerName = 'Test Player';
        component.lifeSelected = true;
        component.rapiditySelected = false;
        expect(component.canJoin()).toBeFalse();
    });
});
