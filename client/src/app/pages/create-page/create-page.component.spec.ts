import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MapListComponent } from '@app/components/map-list/map-list.component';
import { CreatePageComponent } from './create-page.component';

const BASE_STAT = 4;
const UPGRADED_STAT = 6;

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
        component.selectLife();
        expect(component.lifeSelected).toBeTrue();
        expect(component.stats.life).toBe(UPGRADED_STAT);
        component.selectLife();
        expect(component.lifeSelected).toBeFalse();
        expect(component.stats.life).toBe(BASE_STAT);
    });

    it('should select and deselect rapidity', () => {
        component.lifeSelected = false;
        component.selectRapidity();
        expect(component.rapiditySelected).toBeTrue();
        expect(component.stats.rapidity).toBe(UPGRADED_STAT);
        component.selectRapidity();
        expect(component.rapiditySelected).toBeFalse();
        expect(component.stats.rapidity).toBe(BASE_STAT);
    });

    it('should select and deselect attack', () => {
        component.defenseSelected = false;
        component.selectAttack();
        expect(component.attackSelected).toBeTrue();
        expect(component.stats.attack).toBe('D6');
        component.selectAttack();
        expect(component.attackSelected).toBeFalse();
        expect(component.stats.attack).toBe('D4');
    });

    it('should select and deselect defense', () => {
        component.attackSelected = false;
        component.selectDefense();
        expect(component.defenseSelected).toBeTrue();
        expect(component.stats.defense).toBe('D6');
        component.selectDefense();
        expect(component.defenseSelected).toBeFalse();
        expect(component.stats.defense).toBe('D4');
    });

    it('should return correct portrait image', () => {
        component.currentPortraitIndex = 0;
        expect(component.getCurrentPortraitImage()).toBe('/assets/portraits/portrait1.png');
        component.currentPortraitIndex = 5;
        expect(component.getCurrentPortraitImage()).toBe('/assets/portraits/portrait6.png');
    });
});
