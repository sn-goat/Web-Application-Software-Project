import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { BOARD_SIZE_MAPPING } from '@app/constants/map-size-limitd';
import { TileApplicatorService } from '@app/services/code/tile-applicator.service';
import { MapService } from '@app/services/code/map.service';
import { ToolSelectionService } from '@app/services/code/tool-selection.service';
import { Board } from '@common/board';
import { Item, Size } from '@common/enums';
import { BehaviorSubject } from 'rxjs';
import { EditToolItemComponent } from './edit-tool-item.component';

describe('EditToolItemComponent', () => {
    let component: EditToolItemComponent;
    let fixture: ComponentFixture<EditToolItemComponent>;
    let mockMapService: jasmine.SpyObj<MapService>;
    let mockToolSelectionService: jasmine.SpyObj<ToolSelectionService>;
    let mockTileApplicatorService: jasmine.SpyObj<TileApplicatorService>;

    beforeEach(async () => {
        mockMapService = jasmine.createSpyObj('MapService', ['getBoardToSave', 'getBoardSize', 'getMode']);
        mockTileApplicatorService = jasmine.createSpyObj<TileApplicatorService>('TileApplicatorService', ['setDropOnItem']);

        mockToolSelectionService = jasmine.createSpyObj<ToolSelectionService>('ToolSelectionService', ['updateSelectedItem'], {
            nbrChestOnBoard$: new BehaviorSubject<number>(0),
            nbrSpawnOnBoard$: new BehaviorSubject<number>(0),
            itemOnBoard$: new BehaviorSubject<Set<Item>>(new Set()),
        });

        await TestBed.configureTestingModule({
            imports: [EditToolItemComponent],
            providers: [
                { provide: MapService, useValue: mockMapService },
                { provide: ToolSelectionService, useValue: mockToolSelectionService },
                { provide: TileApplicatorService, useValue: mockTileApplicatorService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EditToolItemComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set remainingItem and isDraggable for SPAWN type', () => {
        const boardSize = Size.SMALL as Size;
        const maxObjectByType = BOARD_SIZE_MAPPING[boardSize];
        const mockBoard = {
            _id: '123',
            name: 'Test Board',
            description: 'A sample board',
            isCTF: false,
            size: boardSize,
        } as Board;

        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);
        (mockToolSelectionService.nbrSpawnOnBoard$ as BehaviorSubject<number>).next(2);

        component.type = Item.SPAWN;
        component.ngOnInit();

        expect(component.remainingItem).toBe(maxObjectByType - 2);
        expect(component.isDraggable).toBe(maxObjectByType - 2 > 0);
    });

    it('should set remainingItem and isDraggable for CHEST type', () => {
        const boardSize = Size.SMALL;
        const maxObjectByType = BOARD_SIZE_MAPPING[boardSize];
        const mockBoard = {
            _id: '123',
            name: 'Test Board',
            description: 'A sample board',
            isCTF: false,
            size: boardSize,
        } as Board;

        // Create a BehaviorSubject with the mock board
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);
        (mockToolSelectionService.nbrChestOnBoard$ as BehaviorSubject<number>).next(1);

        component.type = Item.CHEST;
        component.ngOnInit();

        expect(component.remainingItem).toBe(maxObjectByType - 1);
        expect(component.isDraggable).toBe(maxObjectByType - 1 > 0);
    });

    it('should set remainingItem and isDraggable for other types', () => {
        const boardSize = Size.SMALL;
        const mockBoard = {
            _id: '123',
            name: 'Test Board',
            description: 'A sample board',
            isCTF: false,
            size: boardSize,
        } as Board;

        // Create a BehaviorSubject with the mock board
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);
        const items = new Set<Item>();
        (mockToolSelectionService.itemOnBoard$ as BehaviorSubject<Set<Item>>).next(items);

        component.type = Item.BOW;
        component.ngOnInit();

        expect(component.remainingItem).toBe(1);
        expect(component.isDraggable).toBe(true);

        items.add(Item.BOW);
        (mockToolSelectionService.itemOnBoard$ as BehaviorSubject<Set<Item>>).next(items);
        component.ngOnInit();

        expect(component.remainingItem).toBe(0);
        expect(component.isDraggable).toBe(false);
    });

    it('should call updateSelectedItem on onDragStart()', () => {
        component.type = Item.CHEST;
        component.onDragStart();
        expect(mockToolSelectionService.updateSelectedItem).toHaveBeenCalledWith(Item.CHEST);
    });

    it('should call setDropOnItem on onDragEnter()', () => {
        const event = new MouseEvent('dragenter');
        spyOn(event, 'preventDefault');
        component.type = Item.CHEST;

        component.onDragEnter(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockTileApplicatorService.setDropOnItem).toHaveBeenCalledWith(Item.CHEST);
    });

    it('should return the correct description from getDescription()', () => {
        const description = component.getDescription(Item.CHEST);
        expect(description).toBe(ASSETS_DESCRIPTION.get(Item.CHEST) ?? '');
    });

    it('should return an empty string if type is not found in getDescription()', () => {
        const description = component.getDescription('floor' as Item); // Type non défini
        expect(description).toBe('');
    });
});
