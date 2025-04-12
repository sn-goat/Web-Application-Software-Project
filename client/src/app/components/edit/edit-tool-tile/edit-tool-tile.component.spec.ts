import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolSelectionService } from '@app/services/tool-selection/tool-selection.service';
import { Tile } from '@common/enums';
import { BehaviorSubject } from 'rxjs';
import { EditToolTileComponent } from './edit-tool-tile.component';

describe('EditToolTileComponent', () => {
    let component: EditToolTileComponent;
    let fixture: ComponentFixture<EditToolTileComponent>;
    let mockToolSelection: jasmine.SpyObj<ToolSelectionService>;
    let selectedTile$: BehaviorSubject<string>;

    beforeEach(async () => {
        selectedTile$ = new BehaviorSubject<string>('someType');
        mockToolSelection = jasmine.createSpyObj('ToolSelectionService', ['updateSelectedTile'], { selectedTile$ });

        await TestBed.configureTestingModule({
            imports: [EditToolTileComponent],
            providers: [{ provide: ToolSelectionService, useValue: mockToolSelection }],
        }).compileComponents();

        fixture = TestBed.createComponent(EditToolTileComponent);
        component = fixture.componentInstance;
        component.type = Tile.Wall;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update styleClass based on selectedTile$', () => {
        selectedTile$.next(Tile.Wall);
        expect(component.styleClass).toBe('selected');

        selectedTile$.next(Tile.Ice);
        expect(component.styleClass).toBe('unselected');
    });

    it('should call updateSelectedTile on click', () => {
        component.onClick();
        expect(mockToolSelection.updateSelectedTile).toHaveBeenCalledWith(Tile.Wall);
    });

    it('should clean up subscription on destroy', () => {
        spyOn(component, 'ngOnDestroy').and.callThrough();
        component.ngOnDestroy();
        fixture.destroy();
        expect(component.ngOnDestroy).toHaveBeenCalled();
    });

    it('returns true for Tile.Ice', () => {
        expect(component.shouldShowAbove(Tile.Ice)).toBe(true);
    });

    it('returns true for Tile.Water', () => {
        expect(component.shouldShowAbove(Tile.Water)).toBe(true);
    });

    it('returns false for other Tile types', () => {
        expect(component.shouldShowAbove(Tile.ClosedDoor)).toBe(false);
        expect(component.shouldShowAbove(Tile.Wall)).toBe(false);
    });
});
