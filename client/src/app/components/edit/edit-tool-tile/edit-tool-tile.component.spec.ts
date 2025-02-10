import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { ToolSelectionService } from '@app/services/code/tool-selection.service';
import { Tile } from '@common/enums';
import { BehaviorSubject, Subject } from 'rxjs';
import { EditToolTileComponent } from './edit-tool-tile.component';

describe('EditToolTileComponent', () => {
    let component: EditToolTileComponent;
    let fixture: ComponentFixture<EditToolTileComponent>;
    let mockToolSelection: jasmine.SpyObj<ToolSelectionService>;
    let selectedTile$: BehaviorSubject<string>;
    let destroy$: Subject<void>;

    beforeEach(async () => {
        selectedTile$ = new BehaviorSubject<string>('someType');
        destroy$ = new Subject<void>();
        mockToolSelection = jasmine.createSpyObj('ToolSelectionService', ['updateSelectedTile'], { selectedTile$ });

        await TestBed.configureTestingModule({
            imports: [EditToolTileComponent],
            providers: [{ provide: ToolSelectionService, useValue: mockToolSelection }],
        }).compileComponents();

        fixture = TestBed.createComponent(EditToolTileComponent);
        component = fixture.componentInstance;
        component.type = Tile.WALL;
        component.destroy$ = destroy$;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update styleClass based on selectedTile$', () => {
        selectedTile$.next(Tile.WALL);
        expect(component.styleClass).toBe('selected');

        selectedTile$.next(Tile.ICE);
        expect(component.styleClass).toBe('unselected');
    });

    it('should call updateSelectedTile on click', () => {
        component.onClick();
        expect(mockToolSelection.updateSelectedTile).toHaveBeenCalledWith(Tile.WALL);
    });

    it('should clean up subscription on destroy', () => {
        spyOn(component, 'ngOnDestroy').and.callThrough();
        component.ngOnDestroy();
        fixture.destroy();
        expect(component.ngOnDestroy).toHaveBeenCalled();
    });

    it('should set description correctly on init', () => {
        component.type = Tile.FLOOR;
        component.description = '';
        component.ngOnInit();
        expect(component.description).toBe(ASSETS_DESCRIPTION.get(Tile.FLOOR) ?? 'Pas de description');

        component.type = 'invalid' as Tile;
        component.description = 'Pas de description';
        component.ngOnInit();
        expect(component.description).toBe(ASSETS_DESCRIPTION.get('invalid' as Tile) ?? 'Pas de description');
    });
});
