import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AlertComponent } from './alert.component';
import { Alert } from '@app/constants/enums';

describe('AlertComponent', () => {
    let component: AlertComponent;
    let fixture: ComponentFixture<AlertComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AlertComponent],
            providers: [
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        type: Alert.CONFIRM,
                        message: 'Test message',
                    },
                },
                {
                    provide: MatDialogRef,
                    useValue: {},
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AlertComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
