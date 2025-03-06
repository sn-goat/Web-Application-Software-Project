/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BoardService } from '@app/services/code/board.service';
import { MapService } from '@app/services/code/map.service';
import { Board, Cell } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';
import { of } from 'rxjs';
import { MapListComponent } from './map-list.component';

const SMALL_SIZE = 10;
const MEDIUM_SIZE = 15;
const LARGE_SIZE = 20;
const EXTRA_LARGE_SIZE = 25;

class MockServices {
    open = jasmine.createSpy('open').and.returnValue({
        afterClosed: () => of({ name: 'New Game', description: 'New Description', size: 10 }),
    });

    getAllBoards = jasmine.createSpy('getAllBoards').and.returnValue(of([]));
    getBoard = jasmine.createSpy('getBoard').and.returnValue(of({}));
    deleteBoardByName = jasmine.createSpy('deleteBoardByName').and.returnValue(of(undefined));
    toggleVisibility = jasmine.createSpy('toggleVisibility').and.returnValue(of({}));

    setMapData = jasmine.createSpy('setMapData');

    detectChanges = jasmine.createSpy('detectChanges');
}

class MockRouter {
    navigate = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));
}

describe('MapListComponent', () => {
    let component: MapListComponent;
    let fixture: ComponentFixture<MapListComponent>;
    let mockRouter: MockRouter;
    let mockServices: MockServices;

    const generateMockCells = (size: number): Cell[][] => {
        return Array.from({ length: size }, (_, x) =>
            Array.from({ length: size }, (__, y) => ({
                position: { x, y },
                tile: Tile.WALL,
                item: y % 2 === 0 ? Item.CHEST : Item.DEFAULT,
            })),
        );
    };

    const mockBoards: Board[] = [
        {
            _id: '1',
            name: 'Game A',
            size: SMALL_SIZE,
            description: 'Description A',
            board: generateMockCells(SMALL_SIZE),
            visibility: Visibility.PUBLIC,
            isCTF: false,
            image: '',
            updatedAt: new Date(),
            createdAt: new Date(),
        },
        {
            _id: '2',
            name: 'Game B',
            size: MEDIUM_SIZE,
            description: 'Description B',
            board: generateMockCells(MEDIUM_SIZE),
            visibility: Visibility.PRIVATE,
            isCTF: true,
            image: '',
            updatedAt: new Date(),
            createdAt: new Date(),
        },
    ];

    beforeEach(waitForAsync(async () => {
        mockRouter = new MockRouter();
        mockServices = new MockServices();

        mockServices.getAllBoards.and.returnValue(of(mockBoards));
        mockServices.getBoard.and.returnValue(of({ ...mockBoards[0], board: [[]] }));
        mockServices.deleteBoardByName.and.returnValue(of(undefined));
        mockServices.toggleVisibility.and.returnValue(of({ ...mockBoards[0], visibility: Visibility.PRIVATE }));

        await TestBed.configureTestingModule({
            imports: [MapListComponent],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: MatDialog, useValue: mockServices },
                { provide: BoardService, useValue: mockServices },
                { provide: MapService, useValue: mockServices },
                { provide: ChangeDetectorRef, useValue: mockServices },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MapListComponent);
        component = fixture.componentInstance;

        component.isCreationPage = true;
        component.loadingInterval = 10;
        component.items = [...mockBoards];

        spyOn(component, 'reloadPage').and.stub();

        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch boards from the service on init', () => {
        expect(mockServices.getAllBoards).toHaveBeenCalled();
    });

    it('should navigate to edit page when editing a board', fakeAsync(() => {
        const mockBoard = mockBoards[0];

        component.onEdit(mockBoard);
        tick();

        expect(mockServices.getBoard).toHaveBeenCalledWith('Game A');
        expect(mockServices.setMapData).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/edit']);
    }));

    it('should display the correct number of games', () => {
        expect(component.items.length).toBe(2);
    });

    it('should sort items by name correctly', () => {
        component.sortBy = 'name';
        component.items = [{ ...mockBoards[1] }, { ...mockBoards[0] }];

        const sortedItems = component.getFilteredAndSortedItems();

        expect(sortedItems[0].name).toBe('Game A');
        expect(sortedItems[1].name).toBe('Game B');
    });

    it('should sort items by size correctly', () => {
        component.sortBy = 'size';
        component.items = [
            { ...mockBoards[0], size: SMALL_SIZE },
            { ...mockBoards[1], size: MEDIUM_SIZE },
        ];

        const sortedItems = component.getFilteredAndSortedItems();

        expect(sortedItems[0].size).toBe(MEDIUM_SIZE);
        expect(sortedItems[1].size).toBe(SMALL_SIZE);
    });

    it('should delete a board when onDelete is called', fakeAsync(() => {
        const mockBoard = mockBoards[0];
        component.items = [...mockBoards];

        mockServices.deleteBoardByName.and.callFake(() => {
            setTimeout(() => {
                mockServices.detectChanges();
            });
            return of(undefined);
        });

        component.onDelete(mockBoard);
        tick(100);

        expect(mockServices.deleteBoardByName).toHaveBeenCalledWith('Game A');
        expect(component.items.length).toBe(1);
        expect(mockServices.detectChanges).toHaveBeenCalled();
    }));

    it('should update items after board deletion', fakeAsync(() => {
        const mockBoard = mockBoards[0];
        component.items = [...mockBoards];
        const initialLength = component.items.length;

        component.onDelete(mockBoard);
        tick();

        expect(component.items.length).toBe(initialLength - 1);
        expect(component.items.find((item) => item._id === mockBoard._id)).toBeFalsy();
    }));

    it('should toggle visibility of a board', fakeAsync(() => {
        const mockBoard = { ...mockBoards[0] };

        component.toggleVisibility(mockBoard);
        tick();

        expect(mockServices.toggleVisibility).toHaveBeenCalledWith('Game A');
    }));

    it('should handle image loading error', () => {
        const fallbackUrl = 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba';
        const event = { target: { src: 'invalid-image.jpg' } } as unknown as Event;

        component.handleImageError(event);

        expect((event.target as HTMLImageElement).src).toBe(fallbackUrl);
    });

    it('should create a new map and navigate to edit page', fakeAsync(() => {
        component.createNewMap();
        tick();

        expect(mockServices.open).toHaveBeenCalled();
        expect(mockServices.setMapData).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/edit']);
    }));

    it('should correctly compare maps that are equal', () => {
        const map1 = { ...mockBoards[0] };
        const map2 = { ...mockBoards[0] };

        expect(component.areMapsEqual(map1, map2)).toBeTrue();
    });

    it('should correctly compare maps that are different', () => {
        const map1 = { ...mockBoards[0] };
        const map2 = { ...mockBoards[0], name: 'Different Name' };

        expect(component.areMapsEqual(map1, map2)).toBeFalse();
    });

    it('should return the correct size class based on map size', () => {
        expect(component.getSizeClass(SMALL_SIZE)).toBe('size-small');
        expect(component.getSizeClass(MEDIUM_SIZE)).toBe('size-medium');
        expect(component.getSizeClass(LARGE_SIZE)).toBe('size-large');
        expect(component.getSizeClass(EXTRA_LARGE_SIZE)).toBe('size-default');
    });

    it('should alert and reload if map not found on server', fakeAsync(() => {
        const mockMap = mockBoards[0];
        mockServices.getAllBoards.and.returnValue(of([])); // Return empty array to simulate map not found
        spyOn(window, 'alert');

        component.onDivClick(mockMap);
        tick();

        expect(window.alert).toHaveBeenCalledWith('La carte a été supprimée du serveur.');
        expect(component.reloadPage).toHaveBeenCalled();
    }));

    it('should alert and reload if map has changed on server', fakeAsync(() => {
        const mockMap = mockBoards[0];
        const serverMap = { ...mockMap, name: 'Changed Name' };
        mockServices.getAllBoards.and.returnValue(of([serverMap]));
        spyOn(window, 'alert');

        component.onDivClick(mockMap);
        tick();

        expect(window.alert).toHaveBeenCalledWith('Les informations du jeu ont changé sur le serveur. La page va être rechargée.');
        expect(component.reloadPage).toHaveBeenCalled();
    }));

    it('should emit divClicked event if map is valid', fakeAsync(() => {
        const mockMap = mockBoards[0];
        mockServices.getAllBoards.and.returnValue(of([mockMap]));
        spyOn(component.divClicked, 'emit');

        component.onDivClick(mockMap);
        tick();

        expect(component.divClicked.emit).toHaveBeenCalled();
    }));
});
