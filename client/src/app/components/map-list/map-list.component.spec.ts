import { CdkVirtualScrollViewport, ScrollingModule, ViewportRuler } from '@angular/cdk/scrolling';
import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Items, Tiles } from '@app/enum/tile';
import { BoardCell } from '@app/interfaces/board/board-cell';
import { BoardGame, BoardStatus, BoardVisibility } from '@app/interfaces/board/board-game';
import { BoardService } from '@app/services/board.service';
import { Observable, of } from 'rxjs';
import { MapListComponent } from './map-list.component';

describe('MapListComponent', () => {
    let component: MapListComponent;
    let fixture: ComponentFixture<MapListComponent>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockDialog: jasmine.SpyObj<MatDialog>;
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
            return of(true);
        }
    }

    const mockDialogRef = new MockMatDialogRef() as unknown as MatDialogRef<any>;

    beforeEach(async () => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockBoardService = jasmine.createSpyObj('BoardService', ['deleteBoardByName', 'toggleVisibility', 'getAllBoards']);
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
                { provide: BoardService, useValue: mockBoardService },
                { provide: ViewportRuler, useValue: mockViewportRuler },
                { provide: ChangeDetectorRef, useValue: mockCdr },
                { provide: CdkVirtualScrollViewport, useClass: MockVirtualScrollViewport },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MapListComponent);
        component = fixture.componentInstance; 

        mockBoardService.getAllBoards.and.returnValue(of([])); // Ensure getAllBoards returns a valid observable
        fixture.detectChanges();
    });

    afterEach(() => {});

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display the list of available games', () => {
        const mockMaps: BoardGame[] = [
            { _id: '1', name: 'Game A', size: 10, description: 'Desc A', boardCells: [], status: 'Ongoing', visibility: 'Public' },
            { _id: '2', name: 'Game B', size: 12, description: 'Desc B', boardCells: [], status: 'Ongoing', visibility: 'Private' },
        ];

        mockBoardService.getAllBoards.and.returnValue(of(mockMaps)); 

        fixture = TestBed.createComponent(MapListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges(); 

        const items = fixture.debugElement.queryAll(By.css('.list-item:not(.new-map-card)'));
        expect(items.length).toBe(mockMaps.length);
    });

    it('should display the details of each game', () => {
        const mockMap: BoardGame = {
            _id: '1',
            name: 'Game A',
            size: 10,
            boardCells: mockBoardCells,
            status: 'Ongoing' as BoardStatus,
            visibility: 'Public' as BoardVisibility,
            description: 'A test description',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        mockBoardService.getAllBoards.and.returnValue(of([mockMap]));
        fixture.detectChanges();

        const item = fixture.debugElement.query(By.css('.list-item:not(.new-map-card)'));
        expect(item.nativeElement.textContent).toContain(mockMap.name);
        expect(item.nativeElement.textContent).toContain(mockMap.size.toString());
        expect(item.nativeElement.textContent).toContain(mockMap.status);
    });

    it('should allow toggling the visibility of the game', () => {
        component.showActions = true;
        fixture.detectChanges();

        const visibilityButton = fixture.debugElement.query(By.css('.visibility-btn'));
        expect(visibilityButton).toBeTruthy(); 

        visibilityButton.triggerEventHandler('click', null);
        expect(mockBoardService.toggleVisibility).toHaveBeenCalledWith(component.items[0].name);
    });

    it('should display a preview image of the game', () => {
        const mockMap: BoardGame = {
            _id: '1',
            name: 'Game A',
            size: 10,
            boardCells: mockBoardCells,
            status: 'Ongoing' as BoardStatus,
            visibility: 'Public' as BoardVisibility,
            description: 'A test description',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        mockBoardService.getAllBoards.and.returnValue(of([mockMap]));
        fixture.detectChanges();

        const previewImage = fixture.debugElement.query(By.css('.item-image img'));
        expect(previewImage).not.toBeNull();
    });

    it('should display the game description on image hover', () => {
        const mockMap: BoardGame = {
            _id: '1',
            name: 'Game A',
            size: 10,
            boardCells: mockBoardCells,
            status: 'Ongoing' as BoardStatus,
            visibility: 'Public' as BoardVisibility,
            description: 'A test description',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        mockBoardService.getAllBoards.and.returnValue(of([mockMap]));
        fixture.detectChanges();

        const previewContainer = fixture.debugElement.query(By.css('.item-image'));
        expect(previewContainer).toBeTruthy();

        previewContainer.triggerEventHandler('mouseover', null);
        fixture.detectChanges();

        const description = fixture.debugElement.query(By.css('.item-description'));
        expect(description.nativeElement.textContent).toContain(mockMap.description);
    });

    it('should allow editing a game', () => {
        component.showActions = true; 
        fixture.detectChanges();

        const editButton = fixture.debugElement.query(By.css('.edit-btn'));
        expect(editButton).not.toBeNull();

        editButton.triggerEventHandler('click', null);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/edit', '1']);
    });

    it('should allow deleting a game', () => {
        component.showActions = true;
        fixture.detectChanges();

        const deleteButton = fixture.debugElement.query(By.css('.delete-btn'));
        expect(deleteButton).not.toBeNull();

        deleteButton.triggerEventHandler('click', null);
        expect(mockBoardService.deleteBoardByName).toHaveBeenCalledWith(component.items[0].name);
    });

    it('should allow creating a new game', () => {
        component.showActions = true;
        fixture.detectChanges();

        const createButton = fixture.debugElement.query(By.css('.new-map-card'));
        expect(createButton).toBeTruthy();

        createButton.triggerEventHandler('click', null);
        fixture.detectChanges();

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/edit'], jasmine.any(Object));
    });
});
