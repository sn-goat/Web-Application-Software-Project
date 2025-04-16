import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { FormCharacterComponent } from '@app/components/form-character/form-character.component';
import { MapListComponent } from '@app/components/map-list/map-list.component';
import { CreatePageComponent } from '@app/pages/create-page/create-page.component';

describe('CreatePageComponent', () => {
    let component: CreatePageComponent;
    let fixture: ComponentFixture<CreatePageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CommonModule, FormsModule, MapListComponent, CreatePageComponent, FormCharacterComponent],
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
        component.togglePopup();
        expect(component.isPopupVisible).toBeTrue();
        component.togglePopup();
        expect(component.isPopupVisible).toBeFalse();
    });
});
