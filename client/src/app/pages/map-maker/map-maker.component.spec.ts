import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Board } from '@common/board';
import { MapMakerComponent } from './map-maker.component';
import { MapService } from '@app/services/code/map.service';
import { ToolSelectionService } from '@app/services/code/tool-selection.service';

describe('MapMakerComponent', () => {
    let component: MapMakerComponent;
    let fixture: ComponentFixture<MapMakerComponent>;
    let mockMapService: jasmine.SpyObj<MapService>;
    let mockRouter: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        mockMapService = jasmine.createSpyObj('MapService', [
            'getBoardToSave',
            'setBoardName',
            'setBoardDescription',
            'initializeBoard',
            'getBoardSize',
            'setBoardToFirstValue',
        ]);

        const mockBoard = {
            _id: '123',
            name: 'Test Board',
            description: 'New Desc',
            isCTF: false,
            size: 10,
        } as Board;
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);

        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockRouter.navigate.and.returnValue(Promise.resolve(true));

        await TestBed.configureTestingModule({
            imports: [MapMakerComponent],
            providers: [
                { provide: MapService, useValue: mockMapService },
                { provide: Router, useValue: mockRouter },
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MapMakerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return the correct description from the getter', () => {
        expect(component.description).toBe('New Desc');
    });

    it('should call preventRightClick on contextmenu event', () => {
        const preventRightClickSpy = spyOn(component['mouseEditor'], 'preventRightClick');
        const event = new MouseEvent('contextmenu');
        component.onRightClick(event);
        expect(preventRightClickSpy).toHaveBeenCalledWith(event);
    });

    it('should call updateCoordinate on mousemove event', () => {
        const updateCoordinateSpy = spyOn(component['mouseEditor'], 'updateCoordinate');
        const event = new MouseEvent('mousemove');
        component.onMouseMove(event);
        expect(updateCoordinateSpy).toHaveBeenCalledWith(event);
    });

    it('should call updateCoordinate on drag event', () => {
        const updateCoordinateSpy = spyOn(component['mouseEditor'], 'updateCoordinate');
        const event = new MouseEvent('drag');
        component.onMouseDrag(event);
        expect(updateCoordinateSpy).toHaveBeenCalledWith(event);
    });

    it('should not navigate when confirmReturn is called and cancelled', () => {
        spyOn(window, 'confirm').and.returnValue(false);
        component.confirmReturn();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should set the board name through set name method', () => {
        const newName = 'New Board Name';
        component.name = newName;
        expect(mockMapService.setBoardName).toHaveBeenCalledWith(newName);
    });

    it('should set the board description through set description method', () => {
        const newDescription = 'New Board Description';
        component.description = newDescription;
        expect(mockMapService.setBoardDescription).toHaveBeenCalledWith(newDescription);
    });

    it('should alert when spawn points are not placed', () => {
        const maxObject = 3;
        component['toolSelection'] = {
            getIsSpawnPlaced: () => false,
            isMinimumObjectPlaced: () => true,
            getMaxObjectByType: () => maxObject,
        } as ToolSelectionService;
        const alertSpy = spyOn(window, 'alert');
        component.checkIfReadyToSave();
        expect(alertSpy).toHaveBeenCalledWith('You need to place all the spawns points on the board before saving the map.');
    });

    it('should alert when minimum objects are not placed', () => {
        const maxObject = 5;
        component['toolSelection'] = {
            getIsSpawnPlaced: () => true,
            isMinimumObjectPlaced: () => false,
            getMaxObjectByType: () => maxObject,
        } as ToolSelectionService;
        const alertSpy = spyOn(window, 'alert');
        component.checkIfReadyToSave();
        expect(alertSpy).toHaveBeenCalledWith('You need to place at least 5 item on the map.');
    });

    it('should not save board when save confirmation is cancelled', () => {
        const maxObject = 3;
        component['toolSelection'] = {
            getIsSpawnPlaced: () => true,
            isMinimumObjectPlaced: () => true,
            getMaxObjectByType: () => maxObject,
        } as ToolSelectionService;
        spyOn(window, 'confirm').and.returnValue(false);
        const saveBoardSpy = spyOn(component, 'saveBoard');
        component.checkIfReadyToSave();
        expect(saveBoardSpy).not.toHaveBeenCalled();
    });

    it('should save board, alert success, navigate and reset when confirmed and save is successful', fakeAsync(() => {
        const maxObject = 3;
        component['toolSelection'] = {
            getIsSpawnPlaced: () => true,
            isMinimumObjectPlaced: () => true,
            getMaxObjectByType: () => maxObject,
        } as ToolSelectionService;
        spyOn(window, 'confirm').and.returnValue(true);
        const alertSpy = spyOn(window, 'alert');
        const resetSpy = spyOn(component, 'reset');
        spyOn(component, 'saveBoard').and.returnValue(Promise.resolve('BoardSaved'));

        component.checkIfReadyToSave();
        flush();

        expect(component.saveBoard).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('Map saved successfully!\nBoardSaved');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);
        expect(resetSpy).toHaveBeenCalled();
    }));

    it('should alert error when saveBoard fails', fakeAsync(() => {
        const maxObject = 3;
        component['toolSelection'] = {
            getIsSpawnPlaced: () => true,
            isMinimumObjectPlaced: () => true,
            getMaxObjectByType: () => maxObject,
        } as ToolSelectionService;
        spyOn(window, 'confirm').and.returnValue(true);
        const alertSpy = spyOn(window, 'alert');
        const errorObj = { message: 'Save failed' };
        spyOn(component, 'saveBoard').and.returnValue(Promise.reject(errorObj));

        component.checkIfReadyToSave();
        flush();

        expect(component.saveBoard).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('An error occurred while saving the map.\n' + errorObj.message);
    }));

    it('should handle response and error correctly in saveBoard', () => {
        const mockBoard = { _id: '123', name: 'Test Board', description: 'New Desc', isCTF: false, size: 10 } as Board;
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);

        const successResponse = new HttpResponse({ status: 200, body: 'Success Response' });

        const addBoardSpy = spyOn(component['boardService'], 'addBoard').and.returnValue(of(successResponse));

        component.saveBoard();
        fixture.detectChanges();

        expect(addBoardSpy).toHaveBeenCalledWith(mockBoard);
    });

    it('should handle error correctly in saveBoard', () => {
        const mockBoard = { _id: '123', name: 'Test Board', description: 'New Desc', isCTF: false, size: 10 } as Board;
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);

        const errorResponse = new HttpResponse({ status: 500, body: 'Error Response' });

        const addBoardSpy = spyOn(component['boardService'], 'addBoard').and.returnValue(throwError(() => errorResponse));

        component.saveBoard();
        fixture.detectChanges();

        expect(addBoardSpy).toHaveBeenCalledWith(mockBoard);
    });

    it('should navigate and reset when confirmReturn is called and confirmed', (done) => {
        spyOn(window, 'confirm').and.returnValue(true);
        const resetSpy = spyOn(component, 'reset');

        component.confirmReturn();

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);

        mockRouter.navigate(['/admin']).then(() => {
            expect(resetSpy).toHaveBeenCalled();
            done();
        });
    });

    it('should not navigate and reset when confirmReturn is called and cancelled', () => {
        spyOn(window, 'confirm').and.returnValue(false);
        const resetSpy = spyOn(component, 'reset');

        component.confirmReturn();

        expect(mockRouter.navigate).not.toHaveBeenCalled();
        expect(resetSpy).not.toHaveBeenCalled();
    });
});
