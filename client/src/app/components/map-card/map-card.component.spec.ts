import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Board } from '@common/board';
import { Visibility } from '@common/enums';
import { MapCardComponent } from './map-card.component';

describe('MapCardComponent', () => {
    let component: MapCardComponent;
    let fixture: ComponentFixture<MapCardComponent>;

    const mockBoard: Board = {
        _id: '1',
        name: 'Test Map',
        size: 10,
        description: 'Test Description',
        board: [],
        isCTF: false,
        visibility: Visibility.PUBLIC,
        updatedAt: new Date(),
        createdAt: new Date(),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MapCardComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MapCardComponent);
        component = fixture.componentInstance;
        component.map = mockBoard;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit edit event when onEdit is called', () => {
        spyOn(component.edit, 'emit');
        component.onEdit();
        expect(component.edit.emit).toHaveBeenCalledWith(mockBoard);
    });

    // it('should confirm before emitting delete event', () => {
    //     spyOn(window, 'confirm').and.returnValue(true);
    //     spyOn(component.delete, 'emit');

    //     component.onDelete();
    //     expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "Test Map"?');
    //     expect(component.delete.emit).toHaveBeenCalledWith(mockBoard);
    // });

    it('should not emit delete event if confirmation is cancelled', () => {
        spyOn(window, 'confirm').and.returnValue(false);
        spyOn(component.delete, 'emit');

        component.onDelete();
        expect(component.delete.emit).not.toHaveBeenCalled();
    });

    it('should emit toggleVisibility event when toggleMapVisibility is called', () => {
        spyOn(component.toggleVisibility, 'emit');
        component.toggleMapVisibility();
        expect(component.toggleVisibility.emit).toHaveBeenCalledWith(mockBoard);
    });

    it('should display the map name', () => {
        const nameElement = fixture.debugElement.query(By.css('.item-title'));
        expect(nameElement.nativeElement.textContent).toContain(mockBoard.name);
    });

    it('should display the correct image sources', () => {
        expect(component.srcTiles).toBeDefined();
        expect(component.srcItem).toBeDefined();
        expect(component.srcEdit).toBeDefined();
        expect(component.srcDelete).toBeDefined();
        expect(component.srcVisible).toBeDefined();
        expect(component.srcNotVisible).toBeDefined();
    });
});
