import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditItemAreaComponent } from './edit-item-area.component';

describe('EditItemAreaComponent', () => {
    let component: EditItemAreaComponent;
    let fixture: ComponentFixture<EditItemAreaComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditItemAreaComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EditItemAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
