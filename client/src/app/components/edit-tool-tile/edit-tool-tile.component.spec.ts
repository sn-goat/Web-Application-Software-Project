import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditToolTileComponent } from './edit-tool-tile.component';

describe('EditToolComponent', () => {
    let component: EditToolTileComponent;
    let fixture: ComponentFixture<EditToolTileComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditToolTileComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EditToolTileComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
