import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Visibility } from '@common/enums';
import { FormDialogComponent } from './form-dialog.component';

describe('FormDialogComponent', () => {
    let component: FormDialogComponent;
    let fixture: ComponentFixture<FormDialogComponent>;
    let dialogRef: jasmine.SpyObj<MatDialogRef<FormDialogComponent>>;

    beforeEach(async () => {
        dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

        await TestBed.configureTestingModule({
            imports: [FormsModule, BrowserAnimationsModule, FormDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: MAT_DIALOG_DATA, useValue: {} },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FormDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should mark form as touched when invalid', () => {
        const mockForm = {
            valid: false,
            control: {
                markAllAsTouched: jasmine.createSpy('markAllAsTouched'),
            },
            controls: {},
        } as unknown as NgForm;

        component.submitForm(mockForm);
        expect(mockForm.control.markAllAsTouched).toHaveBeenCalled();
        expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should set errors if name or description is whitespace-only', () => {
        component.data.name = '    ';
        component.data.description = '     ';
        component.data.size = 10;
        component.data.isCTF = false;

        const mockForm = {
            valid: true,
            control: {
                markAllAsTouched: jasmine.createSpy('markAllAsTouched'),
            },
            controls: {
                name: { setErrors: jasmine.createSpy('setErrors') },
                description: { setErrors: jasmine.createSpy('setErrors') },
            },
        } as unknown as NgForm;

        component.submitForm(mockForm);

        expect(mockForm.control.markAllAsTouched).toHaveBeenCalled();
        expect(mockForm.controls.name.setErrors).toHaveBeenCalledWith({ whitespace: true });
        expect(mockForm.controls.description.setErrors).toHaveBeenCalledWith({ whitespace: true });
        expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should close the dialog with trimmed data when form is valid', () => {
        component.data.name = ' Valid Name ';
        component.data.description = 'Valid Description';
        component.data.size = 10;
        component.data.isCTF = false;
        const mockForm = {
            valid: true,
            control: {
                markAllAsTouched: jasmine.createSpy('markAllAsTouched'),
            },
            controls: {},
        } as unknown as NgForm;

        component.submitForm(mockForm);

        expect(dialogRef.close).toHaveBeenCalledWith({
            name: 'Valid Name',
            description: 'Valid Description',
            size: 10,
            isCTF: false,
            board: [],
            visibility: Visibility.PRIVATE,
            image: '',
        });
    });
});
