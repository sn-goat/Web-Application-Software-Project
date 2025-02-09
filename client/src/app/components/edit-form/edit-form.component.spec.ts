import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFormComponent } from './edit-form.component';

describe('FormComponent', () => {
    let component: EditFormComponent;
    let fixture: ComponentFixture<EditFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditFormComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EditFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set isMapSaved to true on submit', () => {
        component.onSubmit();
        expect(component.isMapSaved).toBeTrue();
    });
});
