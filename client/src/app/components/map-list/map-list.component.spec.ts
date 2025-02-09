import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BoardService } from '@app/services/board.service';
import { Board } from '@common/board';
import { Visibility } from '@common/enums';
import { of } from 'rxjs';
import { MapListComponent } from './map-list.component';

describe('MapListComponent', () => {
    let component: MapListComponent;
    let fixture: ComponentFixture<MapListComponent>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockDialog: jasmine.SpyObj<MatDialog>;
    let mockBoardService: jasmine.SpyObj<BoardService>;
    let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;

    const mockBoardGames: Board[] = [
        {
            _id: '1',
            name: 'Game A',
            size: 10,
            description: 'Desc A',
            board: [],
            visibility: Visibility.PUBLIC,
            lastUpdatedAt: new Date(),
            isCTF: false,
            image: '',
        },
        {
            _id: '2',
            name: 'Game B',
            size: 12,
            description: 'Desc B',
            board: [],
            visibility: Visibility.PRIVATE,
            lastUpdatedAt: new Date(),
            isCTF: true,
            image: '',
        },
    ];

    beforeEach(async () => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockBoardService = jasmine.createSpyObj('BoardService', ['getAllBoards', 'deleteBoardByName', 'toggleVisibility']);
        mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

        await TestBed.configureTestingModule({
            imports: [MatDialogModule, MapListComponent],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: MatDialog, useValue: mockDialog },
                { provide: BoardService, useValue: mockBoardService },
                { provide: ChangeDetectorRef, useValue: mockCdr },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MapListComponent);
        component = fixture.componentInstance;
        mockBoardService.getAllBoards.and.returnValue(of(mockBoardGames));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
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
    });

    it('should allow toggling the visibility of the game', () => {
        const mockMap = mockBoardGames[0];
        mockBoardService.toggleVisibility.and.returnValue(of({ ...mockMap, visibility: Visibility.PRIVATE }));
        component.toggleVisibility(mockMap);
        expect(mockBoardService.toggleVisibility).toHaveBeenCalledWith(mockMap.name);
        expect(mockMap.visibility).toBe('Private');
    });

    it('should display a preview image of the game', () => {
        const previewImage = fixture.debugElement.query(By.css('.item-image img'));
        expect(previewImage).not.toBeNull();
    });

    it('should display the game description on image hover', () => {
        const previewContainer = fixture.debugElement.query(By.css('.item-image'));
        expect(previewContainer).toBeTruthy();

        previewContainer.triggerEventHandler('mouseover', null);
        fixture.detectChanges();

        const description = fixture.debugElement.query(By.css('.item-description'));
        expect(description).not.toBeNull();
        expect(description.nativeElement.textContent).toContain(mockBoardGames[0].description);
    });

    it('should allow editing a game', () => {
        const mockMap = mockBoardGames[0];
        component.onEdit(mockMap);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/edit'], { queryParams: { id: mockMap._id } });
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
        dialogRefSpyObj.afterClosed().subscribe((result: { name: string; description: string; size: number }) => {
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/edit'], { queryParams: result });
        });
    });
});
