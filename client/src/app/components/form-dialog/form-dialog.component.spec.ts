import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormDialogComponent } from './form-dialog.component';

describe('FormDialogComponent', () => {
    let component: FormDialogComponent;
    let fixture: ComponentFixture<FormDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormDialogComponent, BrowserAnimationsModule],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: {
                        close: jasmine.createSpy('close'),
                    },
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FormDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
