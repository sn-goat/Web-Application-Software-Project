import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditToolTilesComponent } from './edit-tool-tiles.component';

describe('EditToolTilesComponent', () => {
    let component: EditToolTilesComponent;
    let fixture: ComponentFixture<EditToolTilesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditToolTilesComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EditToolTilesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
