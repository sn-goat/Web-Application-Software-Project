import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmationDialogComponent } from '@app/components/common/confirmation-dialog/confirmation-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogData } from '@app/components/common/confirmation-dialog/confirmation-dialog-data';

describe('ConfirmationDialogComponent', () => {
    let component: ConfirmationDialogComponent;
    let fixture: ComponentFixture<ConfirmationDialogComponent>;
    let mockDialogRef: { close: jasmine.Spy };
    let mockData: ConfirmationDialogData;

    beforeEach(async () => {
        mockDialogRef = { close: jasmine.createSpy('close') };
        mockData = { title: 'Test Title', message: 'Test Message', confirmText: 'Confirm', cancelText: 'Cancel' };

        await TestBed.configureTestingModule({
            imports: [ConfirmationDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: mockData },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmationDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should receive dialog data correctly', () => {
        expect(component.data).toEqual(mockData);
    });

    it('should close the dialog with false when onCancel is called', () => {
        component.onCancel();
        expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should close the dialog with true when onConfirm is called', () => {
        component.onConfirm();
        expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
});
