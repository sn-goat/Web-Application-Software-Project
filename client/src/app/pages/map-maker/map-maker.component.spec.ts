import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MapService } from '@app/services/code/map.service';
import { Board } from '@common/board';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MapMakerComponent } from './map-maker.component';

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

    it('should save the board and navigate when checkIfReadyToSave is called and confirmed', (done) => {
        spyOn(window, 'confirm').and.returnValue(true);
        const saveBoardSpy = spyOn(component, 'saveBoard');
        const alertSpy = spyOn(window, 'alert');
        const resetSpy = spyOn(component, 'reset');

        spyOn(component['toolSelection'], 'getIsReadyToSave').and.returnValue(true);
        component.checkIfReadyToSave();

        expect(saveBoardSpy).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('Map saved successfully!');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);

        mockRouter.navigate(['/admin']).then(() => {
            expect(resetSpy).toHaveBeenCalled();
            done();
        });
    });

    it('should show alert when checkIfReadyToSave is called and not ready to save', () => {
        spyOn(window, 'confirm');
        const alertSpy = spyOn(window, 'alert');

        spyOn(component['toolSelection'], 'getIsReadyToSave').and.returnValue(false);
        component.checkIfReadyToSave();

        expect(alertSpy).toHaveBeenCalledWith('You need to place all the spawns points on the board before saving the map.');
    });

    it('should not save the board when checkIfReadyToSave is called and canceled', () => {
        spyOn(window, 'confirm').and.returnValue(false);
        const saveBoardSpy = spyOn(component, 'saveBoard');
        const alertSpy = spyOn(window, 'alert');
        spyOn(component, 'reset');

        spyOn(component['toolSelection'], 'getIsReadyToSave').and.returnValue(true);
        component.checkIfReadyToSave();

        expect(saveBoardSpy).not.toHaveBeenCalled();
        expect(alertSpy).not.toHaveBeenCalledWith('Map saved successfully!');
        expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/admin']);
        expect(component.reset).not.toHaveBeenCalled();
    });
    it('should navigate and reset when confirmReturn is called and confirmed', (done) => {
        spyOn(window, 'confirm').and.returnValue(true); // Mock confirm dialog to return true
        const resetSpy = spyOn(component, 'reset');

        component.confirmReturn();

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);

        // Wait for the navigate promise to resolve before checking the reset method call
        mockRouter.navigate(['/admin']).then(() => {
            expect(resetSpy).toHaveBeenCalled();
            done(); // Indicate that the asynchronous test is complete
        });
    });

    it('should not navigate and reset when confirmReturn is called and cancelled', () => {
        spyOn(window, 'confirm').and.returnValue(false); // Mock confirm dialog to return false
        const resetSpy = spyOn(component, 'reset');

        component.confirmReturn();

        expect(mockRouter.navigate).not.toHaveBeenCalled();
        expect(resetSpy).not.toHaveBeenCalled();
    });
    it('should handle response and error correctly in saveBoard', () => {
        const mockBoard = { _id: '123', name: 'Test Board', description: 'New Desc', isCTF: false, size: 10 } as Board;
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);

        const successResponse = new HttpResponse({ status: 200, body: 'Success Response' });

        const addBoardSpy = spyOn(component['boardService'], 'addBoard').and.returnValue(of(successResponse));

        component.saveBoard(); // Call the method to trigger the observable
        fixture.detectChanges(); // Ensure Angular processes changes

        expect(addBoardSpy).toHaveBeenCalledWith(mockBoard);
    });

    it('should handle error correctly in saveBoard', () => {
        const mockBoard = { _id: '123', name: 'Test Board', description: 'New Desc', isCTF: false, size: 10 } as Board;
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);

        const errorResponse = new HttpResponse({ status: 500, body: 'Error Response' });

        const addBoardSpy = spyOn(component['boardService'], 'addBoard').and.returnValue(throwError(() => errorResponse));

        component.saveBoard(); // Call the method
        fixture.detectChanges(); // Ensure changes are applied

        expect(addBoardSpy).toHaveBeenCalledWith(mockBoard);
    });
});
