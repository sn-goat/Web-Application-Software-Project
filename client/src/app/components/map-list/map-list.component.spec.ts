import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapListComponent } from './map-list.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { BoardService } from '@app/services/board.service';
import { MapService } from '@app/services/map.service';
import { ViewportRuler, ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ChangeDetectorRef } from '@angular/core';
import { BoardGame } from '@app/interfaces/board/board-game';

describe('MapListComponent', () => {
    let component: MapListComponent;
    let fixture: ComponentFixture<MapListComponent>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockDialog: jasmine.SpyObj<MatDialog>;
    let mockMapService: jasmine.SpyObj<MapService>;
    let mockBoardService: jasmine.SpyObj<BoardService>;
    let mockViewportRuler: jasmine.SpyObj<ViewportRuler>;
    let mockVirtualScroll: jasmine.SpyObj<CdkVirtualScrollViewport>;
    let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;

    beforeEach(async () => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockMapService = jasmine.createSpyObj('MapService', ['getAllMaps']);
        mockBoardService = jasmine.createSpyObj('BoardService', ['deleteBoardByName', 'toggleVisibility']);
        mockViewportRuler = jasmine.createSpyObj('ViewportRuler', ['change']);
        mockVirtualScroll = jasmine.createSpyObj('CdkVirtualScrollViewport', ['elementScrolled']);
        mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

        await TestBed.configureTestingModule({
            imports: [MapListComponent, ScrollingModule],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: MatDialog, useValue: mockDialog },
                { provide: MapService, useValue: mockMapService },
                { provide: BoardService, useValue: mockBoardService },
                { provide: ViewportRuler, useValue: mockViewportRuler },
                { provide: CdkVirtualScrollViewport, useValue: mockVirtualScroll },
                { provide: ChangeDetectorRef, useValue: mockCdr },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MapListComponent);
        component = fixture.componentInstance;
    });

    it('devrait charger les jeux à partir du service', () => {
        const mockMaps: BoardGame[] = [
            {
                _id: '1',
                name: 'Jeu 1',
                size: 20,
                description: 'Desc',
                boardCells: [],
                status: 'Ongoing',
                visibility: 'Public',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];
        mockMapService.getAllMaps.and.returnValue(of(mockMaps));

        component.ngOnInit();
        expect(component.items.length).toBe(1);
        expect(component.items[0].name).toBe('Jeu 1');
    });

    it('devrait filtrer et trier les jeux', () => {
        component.items = [
            { _id: '1', name: 'B', size: 10, description: 'Desc', boardCells: [], status: 'Ongoing', visibility: 'Public', createdAt: new Date() },
            { _id: '2', name: 'A', size: 5, description: 'Desc', boardCells: [], status: 'Completed', visibility: 'Private', createdAt: new Date() },
        ];
        component.searchQuery = 'A';
        component.sortBy = 'name';

        const result = component.getFilteredAndSortedItems();
        expect(result.length).toBe(1);
        expect(result[0].name).toBe('A');
    });

    it("devrait rediriger vers la vue d'édition lors de l'édition d'un jeu", () => {
        const mockGame: BoardGame = {
            _id: '123',
            name: 'Jeu Test',
            size: 10,
            description: 'Desc',
            boardCells: [],
            status: 'Ongoing',
            visibility: 'Public',
        };
        component.onEdit(mockGame);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/edit'], { queryParams: { id: '123' } });
    });

    it('devrait supprimer un jeu après confirmation', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        component.items = [{ _id: '123', name: 'Jeu Test', size: 10, description: 'Desc', boardCells: [], status: 'Ongoing', visibility: 'Public' }];
        mockBoardService.deleteBoardByName.and.returnValue(of<void>(undefined));

        component.onDelete(component.items[0]);
        expect(mockBoardService.deleteBoardByName).toHaveBeenCalledWith('Jeu Test');
        expect(component.items.length).toBe(0);
    });
});
