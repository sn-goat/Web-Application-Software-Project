import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MapService } from '@app/services/code/map.service';
import { Board } from '@common/board';
import { Visibility } from '@common/enums';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MapMakerComponent } from './map-maker.component';

describe('MapMakerComponent', () => {
    let component: MapMakerComponent;
    let fixture: ComponentFixture<MapMakerComponent>;
    let mockMapService: jasmine.SpyObj<MapService>;
    let mockRouter: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        mockMapService = jasmine.createSpyObj(
            'MapService',
            [
                'getBoardToSave',
                'setBoardName',
                'setBoardDescription',
                'initializeBoard',
                'getBoardSize',
                'setBoardToFirstValue',
                'isReadyToSave',
                'isModeCTF',
            ],
            ['remainingItemsToPlace', 'remainingSpawnsToPlace', 'hasFlagOnBoard'],
        );

        mockMapService.nbrItemsToPlace$ = new BehaviorSubject<number>(2);
        mockMapService.nbrSpawnsToPlace$ = new BehaviorSubject<number>(2);

        const mockBoard: Board = {
            _id: '123',
            name: 'Test Board',
            description: 'New Desc',
            isCTF: false,
            size: 10,
            board: [],
            image: '',
            visibility: Visibility.PUBLIC,
            updatedAt: new Date(),
        };
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);

        mockMapService.isReadyToSave.and.returnValue({ isValid: true, error: '' });

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
        // Simulate an invalid state due to missing spawn points.
        mockMapService.isReadyToSave.and.returnValue({ isValid: false, error: 'Vous devez placer tous les points de départs du jeu.' });
        const alertSpy = spyOn(window, 'alert');
        component.checkIfReadyToSave();
        expect(alertSpy).toHaveBeenCalledWith('Vous devez placer tous les points de départs du jeu.');
    });

    it('should alert when minimum objects are not placed', () => {
        // Simulate an invalid state due to missing objects.
        mockMapService.isReadyToSave.and.returnValue({ isValid: false, error: 'Vous devez placer au moins 5 items sur la partie.' });
        const alertSpy = spyOn(window, 'alert');
        component.checkIfReadyToSave();
        expect(alertSpy).toHaveBeenCalledWith('Vous devez placer au moins 5 items sur la partie.');
    });

    it('should not save board when save confirmation is cancelled', () => {
        mockMapService.isReadyToSave.and.returnValue({ isValid: true, error: '' });
        spyOn(window, 'confirm').and.returnValue(false);
        const saveBoardSpy = spyOn(component, 'saveBoard');
        component.checkIfReadyToSave();
        expect(saveBoardSpy).not.toHaveBeenCalled();
    });

    it('should save board, alert success, navigate and reset when confirmed and save is successful', fakeAsync(() => {
        mockMapService.isReadyToSave.and.returnValue({ isValid: true, error: '' });
        spyOn(window, 'confirm').and.returnValue(true);
        const alertSpy = spyOn(window, 'alert');
        const resetSpy = spyOn(component, 'reset');
        spyOn(component, 'saveBoard').and.returnValue(Promise.resolve('BoardSaved'));

        component.checkIfReadyToSave();
        flush();

        expect(component.saveBoard).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('Partie sauvegardée! Vous allez être redirigé.\n');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);
        expect(resetSpy).toHaveBeenCalled();
    }));

    it('should alert error when saveBoard fails', fakeAsync(() => {
        mockMapService.isReadyToSave.and.returnValue({ isValid: true, error: '' });
        spyOn(window, 'confirm').and.returnValue(true);
        const alertSpy = spyOn(window, 'alert');
        const errorObj = 'Save failed';
        spyOn(component, 'saveBoard').and.returnValue(Promise.reject(errorObj));

        component.checkIfReadyToSave();
        flush();

        expect(component.saveBoard).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('Erreur dans la configuration de la partie.\n' + errorObj);
    }));

    it('should handle response correctly in saveBoard when board has no _id', async () => {
        const mockBoard: Board = {
            name: 'Test Board',
            description: 'New Desc',
            isCTF: false,
            size: 10,
            board: [],
            image: '',
            visibility: Visibility.PUBLIC,
            updatedAt: new Date(),
        };
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);

        const successResponse = new HttpResponse({ status: 200, body: 'Success Response' });
        const addBoardSpy = spyOn(component['boardService'], 'addBoard').and.returnValue(of(successResponse));
        const result = await component.saveBoard();
        fixture.detectChanges();
        expect(addBoardSpy).toHaveBeenCalledWith({ ...mockBoard, image: '' });
        expect(result).toEqual('Success Response');
    });

    it('should handle error correctly in saveBoard when adding board fails', async () => {
        const mockBoard: Board = {
            name: 'Test Board',
            description: 'New Desc',
            isCTF: false,
            size: 10,
            board: [],
            image: '',
            visibility: Visibility.PUBLIC,
            updatedAt: new Date(),
        };
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);

        const errorResponse = new HttpResponse({ status: 500, body: 'Error Response' });
        const addBoardSpy = spyOn(component['boardService'], 'addBoard').and.returnValue(throwError(() => errorResponse));

        await expectAsync(component.saveBoard()).toBeRejected();
        fixture.detectChanges();
        expect(addBoardSpy).toHaveBeenCalledWith({ ...mockBoard, image: '' });
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

    it('should update board when board has _id', async () => {
        const mockBoardWithId: Board = {
            _id: 'existing-board-id',
            name: 'Existing Board',
            description: 'New board description',
            board: [],
            image: '',
            visibility: Visibility.PUBLIC,
            isCTF: false,
            size: 10,
            updatedAt: new Date(),
        };
        const boardSubject = new BehaviorSubject<Board>(mockBoardWithId);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);
        const successResponse = new HttpResponse({ status: 200, body: 'Update Success' });
        const updateBoardSpy = spyOn(component['boardService'], 'updateBoard').and.returnValue(of(successResponse));

        const result = await component.saveBoard();
        fixture.detectChanges();
        expect(updateBoardSpy).toHaveBeenCalledWith({ ...mockBoardWithId, image: '' });
        expect(result).toEqual('Update Success');
    });

    it('should handle error with error property correctly in saveBoard', async () => {
        const mockBoard: Board = {
            name: 'New Board',
            description: 'New board description',
            board: [],
            image: '',
            visibility: Visibility.PUBLIC,
            isCTF: false,
            size: 10,
            updatedAt: new Date(),
        };
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);
        const errorObj = { error: { message: 'Custom error message' } };
        const addBoardSpy = spyOn(component['boardService'], 'addBoard').and.returnValue(throwError(() => errorObj));
        await expectAsync(component.saveBoard()).toBeRejectedWith('Custom error message');
        fixture.detectChanges();
        expect(addBoardSpy).toHaveBeenCalledWith(jasmine.objectContaining({ image: '' }));
        const boardArg = addBoardSpy.calls.mostRecent().args[0];
        expect(boardArg._id).toBeUndefined();
    });

    it('should return a screenshot string when captureElementAsString is successful', async () => {
        const expectedScreenshot = 'base64thumbnail';
        spyOn(component['screenshotService'], 'captureElementAsString').and.returnValue(Promise.resolve(expectedScreenshot));
        const screenshotResult = await component.screenshot();
        expect(screenshotResult).toEqual(expectedScreenshot);
        expect(component['screenshotService'].captureElementAsString).toHaveBeenCalledWith('map-screenshot');
    });

    it('should reject with an error message when captureElementAsString fails', async () => {
        const errorMessage = 'capture error';
        spyOn(component['screenshotService'], 'captureElementAsString').and.returnValue(Promise.reject(errorMessage));
        await expectAsync(component.screenshot()).toBeRejectedWith(`Error while screenshot: ${errorMessage}`);
    });

    it('should alert for invalid board name when board name is empty', () => {
        const boardWithEmptyName: Board = {
            _id: '123',
            name: '',
            description: 'Test Desc',
            isCTF: false,
            size: 10,
            board: [],
            image: '',
            visibility: Visibility.PUBLIC,
            updatedAt: new Date(),
        };
        mockMapService.getBoardToSave.and.returnValue(new BehaviorSubject(boardWithEmptyName));
        spyOn(window, 'alert');

        component.checkIfReadyToSave();

        expect(window.alert).toHaveBeenCalledWith('Veuillez donner un nom valide à votre carte');
    });
});
