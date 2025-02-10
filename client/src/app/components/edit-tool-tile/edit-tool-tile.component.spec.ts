import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { ToolSelectionService } from '@app/services/code/tool-selection.service';
import { Tile } from '@common/enums';
import { BehaviorSubject } from 'rxjs';
import { EditToolTileComponent } from './edit-tool-tile.component';

describe('EditToolTileComponent', () => {
    let component: EditToolTileComponent;
    let fixture: ComponentFixture<EditToolTileComponent>;
    let mockToolSelection: jasmine.SpyObj<ToolSelectionService>;
    let selectedTile$: BehaviorSubject<string>;

    beforeEach(async () => {
        selectedTile$ = new BehaviorSubject<string>('someType'); // Mock BehaviorSubject
        mockToolSelection = jasmine.createSpyObj('ToolSelectionService', ['updateSelectedTile'], { selectedTile$: selectedTile$ });

        await TestBed.configureTestingModule({
            imports: [EditToolTileComponent],
            providers: [{ provide: ToolSelectionService, useValue: mockToolSelection }],
        }).compileComponents();

        fixture = TestBed.createComponent(EditToolTileComponent);
        component = fixture.componentInstance;
        component.type = Tile.WALL;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update styleClass based on selectedTile$', () => {
        selectedTile$.next(Tile.WALL);
        expect(component.styleClass).toBe('selected');

        selectedTile$.next(Tile.FLOOR);
        expect(component.styleClass).toBe('unselected');
    });

    it('should update description based on type', () => {
        expect(component.description).toBe(ASSETS_DESCRIPTION.get(Tile.WALL) ?? 'Pas de description');
    });

    it('should call updateSelectedTile on click', () => {
        component.onClick();
        expect(mockToolSelection.updateSelectedTile).toHaveBeenCalledWith(Tile.WALL);
    });
});
