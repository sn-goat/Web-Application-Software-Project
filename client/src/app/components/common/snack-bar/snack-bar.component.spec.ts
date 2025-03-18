import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnackbarComponent } from './snack-bar.component';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

describe('SnackbarComponent', () => {
    let component: SnackbarComponent;
    let fixture: ComponentFixture<SnackbarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SnackbarComponent],
            providers: [{ provide: MAT_SNACK_BAR_DATA, useValue: { message: 'Test Message' } }],
        }).compileComponents();

        fixture = TestBed.createComponent(SnackbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
