/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BoardService } from '@app/services/code/board.service';
import { MapService } from '@app/services/code/map.service';
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
                        tile: Tile.WALL,
                        item: y % 2 === 0 ? Item.CHEST : Item.DEFAULT,
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
            visibility: Visibility.PUBLIC,
            updatedAt: new Date(),
            createdAt: new Date(),
            isCTF: false,
            image: '',
        },
        {
            _id: '2',
            name: 'Game B',
            size: 20,
            description: 'Desc B',
            board: generateMockBoard(10),
            isCTF: false,
            visibility: Visibility.PRIVATE,
            createdAt: new Date(),
            image: '',
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
        await fixture.whenStable();
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
            visibility: Visibility.PUBLIC,
            image: '',
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
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/edit']);
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
        expect(item.nativeElement.textContent).toContain(mockBoardGames[0].visibility);
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
        component.sortBy = 'unknown';
        const sortedItems = component.getFilteredAndSortedItems();
        expect(sortedItems[0].name).toBe('Game A');
        expect(sortedItems[1].name).toBe('Game B');
    });

    it('should alert and reload page if map is not found on server', () => {
        const mockMap = mockBoardGames[0];
        spyOn(window, 'alert');
        const reloadSpy = spyOn(component, 'reloadPage').and.callFake(() => {});
        mockBoardService.getAllBoards.and.returnValue(of([]));

        component.onDivClick(mockMap);

        expect(window.alert).toHaveBeenCalledWith('La carte a été supprimée du serveur.');
        expect(reloadSpy).toHaveBeenCalled();
    });

    it('should allow toggling the visibility of the game', () => {
        const mockMap = mockBoardGames[0];
        mockBoardService.toggleVisibility.and.returnValue(of({ ...mockMap, visibility: Visibility.PRIVATE }));
        component.toggleVisibility(mockMap);
        expect(mockBoardService.toggleVisibility).toHaveBeenCalledWith(mockMap.name);
        expect(mockMap.visibility).toBe('Private');
    });

    it('should display a preview image of the game', async () => {
        component.mapsLoaded = true; // Ensure maps are loaded

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
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/edit']);
        });
    });

    it('should compare maps correctly', () => {
        const localMap: Board = {
            _id: '1',
            name: 'Board 1',
            description: 'Desc 1',
            size: 10,
            visibility: Visibility.PUBLIC,
            board: [],
            updatedAt: new Date(),
            isCTF: false,
            image: '',
        };
        const serverMap: Board = {
            _id: '1',
            name: 'Board 1',
            description: 'Desc 1',
            size: 10,
            visibility: Visibility.PUBLIC,
            board: [],
            updatedAt: new Date(),
            isCTF: false,
            image: '',
        };

        expect(component.areMapsEqual(localMap, serverMap)).toBeTrue();

        serverMap.name = 'Board 2';
        expect(component.areMapsEqual(localMap, serverMap)).toBeFalse();
    });

    it('should alert and reload page if maps are not equal', () => {
        const mockMap = mockBoardGames[0];
        const serverMap = { ...mockMap, name: 'Different Name' };
        spyOn(window, 'alert');
        const reloadSpy = spyOn(component, 'reloadPage').and.callFake(() => {});
        mockBoardService.getAllBoards.and.returnValue(of([serverMap]));

        component.onDivClick(mockMap);

        expect(window.alert).toHaveBeenCalledWith('Les informations du jeu ont changé sur le serveur. La page va être rechargée.');
        expect(reloadSpy).toHaveBeenCalled();
    });

    it('should emit divClicked if maps are equal', () => {
        const mockMap = mockBoardGames[0];
        const serverMap = { ...mockMap };
        spyOn(component.divClicked, 'emit');
        mockBoardService.getAllBoards.and.returnValue(of([serverMap]));

        component.onDivClick(mockMap);

        expect(component.divClicked.emit).toHaveBeenCalled();
    });

    it('should return the size in function of the size class', () => {
        expect(component.getSizeClass(10)).toBe('size-small');
        expect(component.getSizeClass(15)).toBe('size-medium');
        expect(component.getSizeClass(20)).toBe('size-large');
        expect(component.getSizeClass(25)).toBe('size-default');
    });
});
