import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapListComponent } from './map-list.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { BoardService } from '@app/services/board.service';
import { MapService } from '@app/services/map.service';
import { ViewportRuler, ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ChangeDetectorRef } from '@angular/core';
import { BoardGame, BoardStatus, BoardVisibility } from '@app/interfaces/board/board-game';
import { BoardCell } from '@app/interfaces/board/board-cell';
import { Tiles, Items } from '@app/enum/tile';
import { By } from '@angular/platform-browser';

describe('MapListComponent', () => {
    let component: MapListComponent;
    let fixture: ComponentFixture<MapListComponent>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockDialog: jasmine.SpyObj<MatDialog>;
    let mockMapService: jasmine.SpyObj<MapService>;
    let mockBoardService: jasmine.SpyObj<BoardService>;
    let mockViewportRuler: jasmine.SpyObj<ViewportRuler>;
    let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;

    const mockBoardCells: BoardCell[][] = [
        [
            { position: { x: 0, y: 0 }, tile: Tiles.Wall, item: Items.StartingPoint },
            { position: { x: 0, y: 1 }, tile: Tiles.OpenDoor, item: Items.Flag },
        ],
        [
            { position: { x: 1, y: 0 }, tile: Tiles.Water, item: Items.NoItem },
            { position: { x: 1, y: 1 }, tile: Tiles.Ice, item: Items.Game },
        ],
    ];

    class MockMatDialogRef<T = any> {
        close = jasmine.createSpy('close');
        afterClosed(): Observable<boolean> {
            return of(true); // Simulate dialog closing with a response
        }
    }

    const mockDialogRef = new MockMatDialogRef() as unknown as MatDialogRef<any>;

    beforeEach(async () => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockMapService = jasmine.createSpyObj('MapService', ['getAllMaps']);
        mockBoardService = jasmine.createSpyObj('BoardService', ['deleteBoardByName', 'toggleVisibility']);
        mockViewportRuler = jasmine.createSpyObj('ViewportRuler', ['change']);
        mockViewportRuler.change.and.returnValue(of(new Event('change')));
        mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

        mockDialog.open.and.returnValue(mockDialogRef);

        class MockVirtualScrollViewport {
            elementScrolled() {
                return of(new Event('scroll'));
            }
        }

        await TestBed.configureTestingModule({
            imports: [ScrollingModule],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: MatDialog, useValue: mockDialog },
                { provide: MapService, useValue: mockMapService },
                { provide: BoardService, useValue: mockBoardService },
                { provide: ViewportRuler, useValue: mockViewportRuler },
                { provide: ChangeDetectorRef, useValue: mockCdr },
                { provide: CdkVirtualScrollViewport, useClass: MockVirtualScrollViewport },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MapListComponent);
        component = fixture.componentInstance; // ✅ Initialize component

        mockMapService.getAllMaps.and.returnValue(of([])); // Ensure getAllMaps returns a valid observable
        fixture.detectChanges();
    });

    afterEach(() => {});

    // ✅ Test: Should display all available games in a list
    it('devrait afficher la liste des jeux disponibles', () => {
        const mockMaps: BoardGame[] = [
            { _id: '1', name: 'Jeu A', size: 10, description: 'Desc A', boardCells: [], status: 'Ongoing', visibility: 'Public' },
            { _id: '2', name: 'Jeu B', size: 12, description: 'Desc B', boardCells: [], status: 'Ongoing', visibility: 'Private' },
        ];

        mockMapService.getAllMaps.and.returnValue(of(mockMaps)); // ✅ Set up mock data

        fixture = TestBed.createComponent(MapListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges(); // ✅ Now run change detection

        const items = fixture.debugElement.queryAll(By.css('.list-item:not(.new-map-card)'));
        expect(items.length).toBe(mockMaps.length); // ✅ Check if both items are rendered
    });

    // ✅ Test: Each game should display required details (name, size, mode, last modified date)
    it('devrait afficher les détails de chaque jeu', () => {
        const mockMap: BoardGame = {
            _id: '1',
            name: 'Jeu A',
            size: 10,
            boardCells: mockBoardCells,
            status: 'Ongoing' as BoardStatus,
            visibility: 'Public' as BoardVisibility,
            description: 'Une description de test',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        mockMapService.getAllMaps.and.returnValue(of([mockMap]));
        fixture.detectChanges();

        // ✅ Select only game items, excluding the "Create New Map" card
        const item = fixture.debugElement.query(By.css('.list-item:not(.new-map-card)'));
        expect(item.nativeElement.textContent).toContain(mockMap.name);
        expect(item.nativeElement.textContent).toContain(mockMap.size.toString());
        expect(item.nativeElement.textContent).toContain(mockMap.status);
    });

    // ✅ Test: Each game should have a modifiable visibility setting
    it('devrait permettre de modifier la visibilité du jeu', () => {
        component.showActions = true; // ✅ Ensure actions are visible
        fixture.detectChanges();

        const visibilityButton = fixture.debugElement.query(By.css('.visibility-btn'));
        expect(visibilityButton).toBeTruthy(); // ✅ Ensure button exists

        visibilityButton.triggerEventHandler('click', null);
        expect(mockBoardService.toggleVisibility).toHaveBeenCalledWith(component.items[0].name);
    });

    // ✅ Test: Each game should have a preview image
    it('devrait afficher une image de prévisualisation du jeu', () => {
        const mockMap: BoardGame = {
            _id: '1',
            name: 'Jeu A',
            size: 10,
            boardCells: mockBoardCells,
            status: 'Ongoing' as BoardStatus,
            visibility: 'Public' as BoardVisibility,
            description: 'Une description de test',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        mockMapService.getAllMaps.and.returnValue(of([mockMap])); // ✅ Provide mock data
        fixture.detectChanges(); // ✅ Trigger rendering

        const previewImage = fixture.debugElement.query(By.css('.item-image img'));
        expect(previewImage).not.toBeNull(); // ✅ Check if image exists
    });

    it("devrait afficher la description du jeu lors du survol de l'image", () => {
        const mockMap: BoardGame = {
            _id: '1',
            name: 'Jeu A',
            size: 10,
            boardCells: mockBoardCells,
            status: 'Ongoing' as BoardStatus,
            visibility: 'Public' as BoardVisibility,
            description: 'Une description de test',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        mockMapService.getAllMaps.and.returnValue(of([mockMap]));
        fixture.detectChanges();

        const previewContainer = fixture.debugElement.query(By.css('.item-image'));
        expect(previewContainer).toBeTruthy(); // ✅ Ensure the element exists

        previewContainer.triggerEventHandler('mouseover', null);
        fixture.detectChanges();

        const description = fixture.debugElement.query(By.css('.item-description'));
        expect(description.nativeElement.textContent).toContain(mockMap.description);
    });

    it("devrait permettre la modification d'un jeu", () => {
        component.showActions = true; // ✅ Ensure buttons are visible
        fixture.detectChanges();

        const editButton = fixture.debugElement.query(By.css('.edit-btn'));
        expect(editButton).not.toBeNull(); // ✅ Ensure button exists before triggering event

        editButton.triggerEventHandler('click', null);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/edit', '1']);
    });

    it("devrait permettre la suppression d'un jeu", () => {
        component.showActions = true; // ✅ Ensure delete button is visible
        fixture.detectChanges();

        const deleteButton = fixture.debugElement.query(By.css('.delete-btn'));
        expect(deleteButton).not.toBeNull(); // ✅ Ensure button exists

        deleteButton.triggerEventHandler('click', null);
        expect(mockBoardService.deleteBoardByName).toHaveBeenCalledWith(component.items[0].name);
    });

    it("devrait permettre la création d'un nouveau jeu", () => {
        component.showActions = true; // ✅ Ensure button is visible
        fixture.detectChanges();

        const createButton = fixture.debugElement.query(By.css('.new-map-card'));
        expect(createButton).toBeTruthy();

        createButton.triggerEventHandler('click', null);
        fixture.detectChanges();

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/edit'], jasmine.any(Object));
    });

});
