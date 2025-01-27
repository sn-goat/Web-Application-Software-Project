import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMapAreaComponent } from './edit-map-area.component';

describe('EditMapAreaComponent', () => {
    let component: EditMapAreaComponent;
    let fixture: ComponentFixture<EditMapAreaComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditMapAreaComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EditMapAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
