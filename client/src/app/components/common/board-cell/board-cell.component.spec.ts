import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolSelectionService } from '@app/services/tool-selection/tool-selection.service';
import { Cell } from '@common/board';
import { Item } from '@common/enums';
import { BoardCellComponent } from './board-cell.component';

describe('BoardCellComponent', () => {
    let component: BoardCellComponent;
    let fixture: ComponentFixture<BoardCellComponent>;
    let toolSelectionService: jasmine.SpyObj<ToolSelectionService>;

    beforeEach(async () => {
        const spy = jasmine.createSpyObj('ToolSelectionService', ['updateSelectedItem']);

        await TestBed.configureTestingModule({
            imports: [BoardCellComponent],
            providers: [{ provide: ToolSelectionService, useValue: spy }],
        }).compileComponents();

        toolSelectionService = TestBed.inject(ToolSelectionService) as jasmine.SpyObj<ToolSelectionService>;
        fixture = TestBed.createComponent(BoardCellComponent);
        component = fixture.componentInstance;
        component.cell = { item: 'Bow' } as Cell;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call updateSelectedItem on drag', () => {
        component.onDrag();
        expect(toolSelectionService.updateSelectedItem).toHaveBeenCalledWith(component.cell.item);
    });

    it('should prevent default on drop', () => {
        const event = new DragEvent('drop');
        spyOn(event, 'preventDefault');
        component.onDrop(event);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent default on drag over', () => {
        const event = new DragEvent('dragover');
        spyOn(event, 'preventDefault');
        component.onDragOver(event);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should have correct srcTiles', () => {
        expect(component.srcTiles).toBe('./assets/tiles/');
    });

    it('should have correct srcItem', () => {
        expect(component.srcItem).toBe('./assets/items/');
    });

    it('should have correct fileType', () => {
        expect(component.fileType).toBe('.png');
    });
    it('should get item description', () => {
        expect(component.getItemDescription(Item.Bow)).toContain('Arc');
    });

    it('should call event.preventDefault when isInGameView is true', () => {
        const mockEvent = new DragEvent('dragstart');
        spyOn(mockEvent, 'preventDefault');
        component.isInGameView = true;

        component.onDragStart(mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should NOT call event.preventDefault when isInGameView is false', () => {
        const mockEvent = new DragEvent('dragstart');
        spyOn(mockEvent, 'preventDefault');
        component.isInGameView = false;

        component.onDragStart(mockEvent);

        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
});
