import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { EditItemAreaComponent } from './edit-item-area.component';

describe('EditItemAreaComponent', () => {
    let component: EditItemAreaComponent;
    let fixture: ComponentFixture<EditItemAreaComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditItemAreaComponent, MatCardModule],
        }).compileComponents();

        fixture = TestBed.createComponent(EditItemAreaComponent);
        component = fixture.componentInstance;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set selectedGrid to the provided gridId', () => {
        const gridId = 'ItemsGrid';
        component.showGrid(gridId);
        expect(component.selectedGrid).toBe(gridId);
    });
});
