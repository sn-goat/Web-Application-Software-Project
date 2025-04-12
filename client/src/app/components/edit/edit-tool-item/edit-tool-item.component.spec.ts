/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ASSETS_DESCRIPTION } from '@app/constants/descriptions';
import { ItemApplicatorService } from '@app/services/item-applicator/item-applicator.service';
import { MapService } from '@app/services/map/map.service';
import { ToolSelectionService } from '@app/services/tool-selection/tool-selection.service';
import { Item } from '@common/enums';
import { BehaviorSubject } from 'rxjs';
import { EditToolItemComponent } from './edit-tool-item.component';

describe('EditToolItemComponent', () => {
    let component: EditToolItemComponent;
    let fixture: ComponentFixture<EditToolItemComponent>;
    let mockMapService: jasmine.SpyObj<MapService>;
    let mockToolSelectionService: jasmine.SpyObj<ToolSelectionService>;
    let mockItemApplicatorService: jasmine.SpyObj<ItemApplicatorService>;

    // Create BehaviorSubjects for the observables used in ngOnInit.
    let nbrSpawnsSubject: BehaviorSubject<number>;
    let nbrItemsSubject: BehaviorSubject<number>;
    let hasFlagSubject: BehaviorSubject<boolean>;

    beforeEach(async () => {
        nbrSpawnsSubject = new BehaviorSubject<number>(5);
        nbrItemsSubject = new BehaviorSubject<number>(10);
        hasFlagSubject = new BehaviorSubject<boolean>(false);

        // Create the MapService mock with observable properties.
        mockMapService = jasmine.createSpyObj('MapService', ['isModeCTF'], {
            nbrSpawnsToPlace$: nbrSpawnsSubject.asObservable(),
            nbrItemsToPlace$: nbrItemsSubject.asObservable(),
            hasFlagOnBoard$: hasFlagSubject.asObservable(),
        });
        // By default, for Flag type, assume we are in CTF mode.
        mockMapService.isModeCTF.and.returnValue(true);

        // Create spies for the other services.
        mockToolSelectionService = jasmine.createSpyObj('ToolSelectionService', ['updateSelectedItem']);
        mockItemApplicatorService = jasmine.createSpyObj('ItemApplicatorService', ['setBackToContainer']);

        await TestBed.configureTestingModule({
            imports: [EditToolItemComponent],
            providers: [
                { provide: MapService, useValue: mockMapService },
                { provide: ToolSelectionService, useValue: mockToolSelectionService },
                { provide: ItemApplicatorService, useValue: mockItemApplicatorService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EditToolItemComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit for Spawn type', () => {
        it('should update remainingItem and isDraggable for Spawn', () => {
            component.type = Item.Spawn;
            // Simulate a new value for the number of spawns.
            nbrSpawnsSubject.next(3);
            component.ngOnInit();

            expect(component.remainingItem).toBe(3);
            expect(component.isDraggable).toBeTrue();

            // Now simulate no spawns remaining.
            nbrSpawnsSubject.next(0);
            // The BehaviorSubject emits synchronously.
            expect(component.remainingItem).toBe(0);
            expect(component.isDraggable).toBeFalse();
        });
    });

    describe('ngOnInit for Flag type', () => {
        it('should update isDraggable for Flag when in CTF mode and no flag is placed', () => {
            component.type = Item.Flag;
            hasFlagSubject.next(false);
            component.ngOnInit();
            expect(component.isDraggable).toBeTrue();
        });

        it('should update isDraggable for Flag when in CTF mode and flag is placed', () => {
            component.type = Item.Flag;
            hasFlagSubject.next(true);
            component.ngOnInit();
            expect(component.isDraggable).toBeFalse();
        });

        it('should set isDraggable to false for Flag when not in CTF mode', () => {
            component.type = Item.Flag;
            mockMapService.isModeCTF.and.returnValue(false);
            component.ngOnInit();
            expect(component.isDraggable).toBeFalse();
        });
    });

    describe('ngOnInit for other types', () => {
        it('should update remainingItem and isDraggable for non-Spawn/Flag types', () => {
            component.type = Item.Chest;
            nbrItemsSubject.next(7);
            component.ngOnInit();

            expect(component.remainingItem).toBe(7);
            expect(component.isDraggable).toBeTrue();

            // Now simulate no remaining items.
            nbrItemsSubject.next(0);
            expect(component.remainingItem).toBe(0);
            expect(component.isDraggable).toBeFalse();
        });
    });

    describe('onDragStart', () => {
        it('should call updateSelectedItem with the component type', () => {
            component.type = Item.Chest;
            component.onDragStart();
            expect(mockToolSelectionService.updateSelectedItem).toHaveBeenCalledWith(Item.Chest);
        });
    });

    describe('onDragEnter', () => {
        it('should prevent default and call setBackToContainer with the type', () => {
            const event = new MouseEvent('dragenter');
            spyOn(event, 'preventDefault');
            component.type = Item.Chest;
            component.onDragEnter(event);
            expect(event.preventDefault).toHaveBeenCalled();
            expect(mockItemApplicatorService.setBackToContainer).toHaveBeenCalledWith(Item.Chest);
        });
    });

    describe('onDragLeave', () => {
        it('should prevent default and call setBackToContainer without arguments', () => {
            const event = new MouseEvent('dragleave');
            spyOn(event, 'preventDefault');
            component.onDragLeave(event);
            expect(event.preventDefault).toHaveBeenCalled();
            expect(mockItemApplicatorService.setBackToContainer).toHaveBeenCalledWith();
        });
    });

    describe('getDescription', () => {
        it('should return the correct description if available', () => {
            const expected = ASSETS_DESCRIPTION.get(Item.Chest) ?? '';
            expect(component.getDescription(Item.Chest)).toBe(expected);
        });
        it('should return an empty string if description is not found', () => {
            expect(component.getDescription('floor' as Item)).toBe('');
        });
    });

    it('should complete destroy$ on ngOnDestroy', () => {
        spyOn(component['destroy$'], 'next');
        spyOn(component['destroy$'], 'complete');
        component.ngOnDestroy();
        expect(component['destroy$'].next).toHaveBeenCalled();
        expect(component['destroy$'].complete).toHaveBeenCalled();
    });
});
