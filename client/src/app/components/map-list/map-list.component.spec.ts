/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BoardService } from '@app/services/board/board.service';
import { MapService } from '@app/services/map/map.service';
import { Board, Cell, Vec2 } from '@common/board';
import { Item, Tile, Visibility } from '@common/enums';
import { of } from 'rxjs';
import { MapListComponent } from './map-list.component';

describe('MapListComponent', () => {
    let component: MapListComponent;
    let fixture: ComponentFixture<MapListComponent>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockDialog: jasmine.SpyObj<MatDialog>;
    let mockBoardService: jasmine.SpyObj<BoardService>;
    let mockMapService: jasmine.SpyObj<MapService>;
    let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;

    const generateMockBoard = (size: number): Cell[][] => {
        return Array.from({ length: size }, (_, x) =>
            Array.from(
                { length: size },
                (__, y) =>
                    ({
                        position: { x, y } as Vec2,
                        tile: Tile.Wall,
                        item: y % 2 === 0 ? Item.Chest : Item.Default,
                    }) as Cell,
            ),
        );
    };

    const mockBoardGames: Board[] = [
        {
            _id: '1',
            name: 'Game A',
            size: 10,
            description: 'Desc A',
            board: generateMockBoard(10),
            visibility: Visibility.Public,
            updatedAt: new Date(),
            createdAt: new Date(),
            isCTF: false,
        },
        {
            _id: '2',
            name: 'Game B',
            size: 20,
            description: 'Desc B',
            board: generateMockBoard(10),
            isCTF: false,
            visibility: Visibility.Private,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    const LOADING_INTERVAL = 10;

    beforeEach(async () => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockBoardService = jasmine.createSpyObj('BoardService', ['getAllBoards', 'deleteBoardByName', 'toggleVisibility', 'getBoard']);
        mockMapService = jasmine.createSpyObj('MapService', ['setMapData']);
        mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

        await TestBed.configureTestingModule({
            imports: [MatDialogModule, MapListComponent],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: MatDialog, useValue: mockDialog },
                { provide: BoardService, useValue: mockBoardService },
                { provide: MapService, useValue: mockMapService },
                { provide: ChangeDetectorRef, useValue: mockCdr },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MapListComponent);
        component = fixture.componentInstance;
        component.isCreationPage = true;
        component.loadingInterval = LOADING_INTERVAL;
        mockBoardService.getAllBoards.and.returnValue(of(mockBoardGames));
        fixture.autoDetectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch board and navigate to edit page', () => {
        const mockBoard: Board = {
            _id: '1',
            name: 'Game A',
            size: 10,
            description: 'Description A',
            board: [],
            isCTF: false,
            visibility: Visibility.Public,
            updatedAt: new Date(),
        };

        const fullMap: Board = {
            ...mockBoard,
            board: [[]],
        };

        mockBoardService.getBoard.and.returnValue(of(fullMap));

        component.onEdit(mockBoard);

        expect(mockBoardService.getBoard).toHaveBeenCalledWith('Game A');
        expect(mockMapService.setMapData).toHaveBeenCalledWith(fullMap);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/edition']);
    });

    it('should display the list of available games', () => {
        const items = fixture.debugElement.queryAll(By.css('.list-item:not(.new-map-card)'));
        expect(items.length).toBe(mockBoardGames.length);
    });

    it('should display the details of each game', () => {
        const item = fixture.debugElement.query(By.css('.list-item:not(.new-map-card)'));
        expect(item).not.toBeNull();
        expect(item.nativeElement.textContent).toContain(mockBoardGames[0].name);
        expect(item.nativeElement.textContent).toContain(mockBoardGames[0].size.toString());
        expect(item.nativeElement.textContent).toContain(mockBoardGames[0].visibility === 'Public' ? 'Publique' : 'Privé');
    });

    it('should sort items by name', () => {
        component.items = [
            { ...mockBoardGames[1], name: 'Game B' },
            { ...mockBoardGames[0], name: 'Game A' },
        ];
        component.sortBy = 'name';
        const sortedItems = component.getFilteredAndSortedItems();
        expect(sortedItems[0].name).toBe('Game A');
        expect(sortedItems[1].name).toBe('Game B');
    });

    it('should sort items by size', () => {
        const sortedItems1 = 12;
        const sortedItems2 = 10;
        component.items = [
            { ...mockBoardGames[0], size: 10 },
            { ...mockBoardGames[1], size: 12 },
        ];
        component.sortBy = 'size';
        const sortedItems = component.getFilteredAndSortedItems();
        expect(sortedItems[0].size).toBe(sortedItems1);
        expect(sortedItems[1].size).toBe(sortedItems2);
    });

    it('should return items unsorted for default case', () => {
        component.items = [
            { ...mockBoardGames[0], name: 'Game A' },
            { ...mockBoardGames[1], name: 'Game B' },
        ];
        component.sortBy = 'updatedAt';
        const sortedItems = component.getFilteredAndSortedItems();
        expect(sortedItems[0].name).toBe('Game A');
        expect(sortedItems[1].name).toBe('Game B');
    });

    it('should allow toggling the visibility of the game', () => {
        const mockMap = mockBoardGames[0];
        mockBoardService.toggleVisibility.and.returnValue(of({ ...mockMap, visibility: Visibility.Private }));
        component.toggleVisibility(mockMap);
        expect(mockBoardService.toggleVisibility).toHaveBeenCalledWith(mockMap.name);
        expect(mockMap.visibility).toBe('Private');
    });

    it('should display a preview image of the game', async () => {
        component.mapsLoaded = true;

        const previewImage = fixture.debugElement.query(By.css('.list-item:not(.new-map-card) .image-container img.base-image'));

        expect(previewImage).not.toBeNull();
    });

    it('should display the game description on image hover', async () => {
        const previewContainer = fixture.debugElement.query(By.css('.list-item:not(.new-map-card) .image-container'));

        expect(previewContainer).toBeTruthy();
        previewContainer.triggerEventHandler('mouseover', null);
        fixture.detectChanges();

        const description = fixture.debugElement.query(By.css('.list-item:not(.new-map-card) .item-description'));
        expect(description).not.toBeNull();
        expect(description.nativeElement.textContent).toContain(mockBoardGames[0].description);
    });

    it('should allow deleting a game', () => {
        const mockMap = mockBoardGames[0];
        spyOn(window, 'confirm').and.returnValue(true);
        mockBoardService.deleteBoardByName.and.returnValue(of(void 0));
        component.onDelete(mockMap);
        expect(mockBoardService.deleteBoardByName).toHaveBeenCalledWith(mockMap.name);
        expect(component.items.length).toBe(1);
    });

    it('should handle image error', () => {
        const event = { target: { src: '' } } as unknown as Event;
        component.handleImageError(event);
        expect((event.target as HTMLImageElement).src).toBe('https://images.unsplash.com/photo-1560419015-7c427e8ae5ba');
    });

    it('should create a new map', () => {
        const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of({ name: 'New Game', description: 'New Desc', size: 10 }) });
        mockDialog.open.and.returnValue(dialogRefSpyObj);
        component.createNewMap();
        expect(mockDialog.open).toHaveBeenCalled();
        dialogRefSpyObj.afterClosed().subscribe(() => {
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/edition']);
        });
    });

    it('should compare maps correctly', () => {
        const localMap: Board = {
            _id: '1',
            name: 'Board 1',
            description: 'Desc 1',
            size: 10,
            visibility: Visibility.Public,
            board: [],
            updatedAt: new Date(),
            isCTF: false,
        };
        const serverMap: Board = {
            _id: '1',
            name: 'Board 1',
            description: 'Desc 1',
            size: 10,
            visibility: Visibility.Public,
            board: [],
            updatedAt: new Date(),
            isCTF: false,
        };

        expect(component.areMapsEqual(localMap, serverMap)).toBeTrue();

        serverMap.name = 'Board 2';
        expect(component.areMapsEqual(localMap, serverMap)).toBeFalse();
    });

    it('should emit divClicked if maps are equal', () => {
        const mockMap = mockBoardGames[0];
        const serverMap = { ...mockMap };
        spyOn(component.divClicked, 'emit');
        mockBoardService.getAllBoards.and.returnValue(of([serverMap]));

        component.onDivClick(mockMap);

        expect(component.divClicked.emit).toHaveBeenCalled();
    });

    it('should filter out non-public items when onlyVisible is true', () => {
        component.onlyVisible = true;
        component.items = [
            { name: 'Game A', visibility: 'Public' },
            { name: 'Game B', visibility: 'Private' },
            { name: 'Game C', visibility: 'Public' },
        ] as Board[];

        const result = component.getFilteredAndSortedItems();
        expect(result.length).toBe(2);
        expect(result.every((item) => item.visibility === 'Public')).toBeTrue();
    });

    it('should not filter items when onlyVisible is false', () => {
        component.onlyVisible = false;
        component.items = [
            { name: 'Game A', visibility: 'Public' },
            { name: 'Game B', visibility: 'Private' },
        ] as Board[];

        const result = component.getFilteredAndSortedItems();
        expect(result.length).toBe(2);
    });

    it('should return an empty list if all items are private and onlyVisible is true', () => {
        component.onlyVisible = true;
        component.items = [
            { name: 'Game A', visibility: 'Private' },
            { name: 'Game B', visibility: 'Private' },
        ] as Board[];

        const result = component.getFilteredAndSortedItems();
        expect(result.length).toBe(0);
    });

    it('should return an empty list when items is empty', () => {
        component.onlyVisible = true;
        component.items = [];

        const result = component.getFilteredAndSortedItems();
        expect(result.length).toBe(0);
    });

    it('should sort items by createdAt in descending order', () => {
        component.sortBy = 'createdAt';
        component.items = [
            { name: 'Game A', createdAt: new Date('2024-01-01') },
            { name: 'Game B', createdAt: new Date('2024-02-01') },
            { name: 'Game C', createdAt: new Date('2023-12-01') },
        ] as Board[];

        const result = component.getFilteredAndSortedItems();
        expect(result[0].name).toBe('Game B');
        expect(result[1].name).toBe('Game A');
        expect(result[2].name).toBe('Game C');
    });

    it('should place items with undefined createdAt at the bottom', () => {
        component.sortBy = 'createdAt';
        component.items = [
            { name: 'Game A', createdAt: new Date('2024-01-01') },
            { name: 'Game B', createdAt: undefined },
            { name: 'Game C', createdAt: new Date('2023-12-01') },
        ] as Board[];

        const result = component.getFilteredAndSortedItems();
        expect(result[result.length - 1].name).toBe('Game B');
    });

    it('should handle null createdAt without crashing', () => {
        component.sortBy = 'createdAt';
        component.items = [
            { name: 'Game A', createdAt: new Date('2024-01-01') },
            { name: 'Game B', createdAt: null },
            { name: 'Game C', createdAt: new Date('2023-12-01') },
        ] as Board[];

        const result = component.getFilteredAndSortedItems();
        expect(result[result.length - 1].name).toBe('Game B');
    });

    it('should handle extreme date values correctly', () => {
        component.sortBy = 'createdAt';
        component.items = [
            { name: 'Game A', createdAt: new Date('1970-01-01') },
            { name: 'Game B', createdAt: new Date('2100-01-01') },
            { name: 'Game C', createdAt: new Date('2023-12-01') },
        ] as Board[];

        const result = component.getFilteredAndSortedItems();
        expect(result[0].name).toBe('Game B');
        expect(result[1].name).toBe('Game C');
        expect(result[2].name).toBe('Game A');
    });
});
