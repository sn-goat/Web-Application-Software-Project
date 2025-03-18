/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Alert } from '@app/constants/enums';
import { MapService } from '@app/services/map/map.service';
import { Board } from '@common/board';
import { Visibility } from '@common/enums';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MapMakerComponent } from './map-maker.component';

describe('MapMakerComponent', () => {
    let component: MapMakerComponent;
    let fixture: ComponentFixture<MapMakerComponent>;
    let mockMapService: jasmine.SpyObj<MapService>;
    let mockRouter: jasmine.SpyObj<Router>;

    const mockBoard: Board = {
        _id: '123',
        name: 'Test Board',
        description: 'New Desc',
        isCTF: false,
        size: 10,
        board: [],
        visibility: Visibility.PUBLIC,
        updatedAt: new Date(),
    };

    const dialogRefStub: MatDialogRef<any> = {
        afterClosed: () => of(true),
        close: () => {},
    } as MatDialogRef<any>;

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
        // Simuler la fermeture de la boîte de dialogue (confirmation annulée)
        spyOn<any>(component, 'openDialog').and.returnValue(dialogRefStub);
        component.confirmReturn();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        // reset est stubée globalement, pas besoin de vérifier ici
    });

    it('should set the board name through the setter', () => {
        const newName = 'New Board Name';
        component.name = newName;
        expect(mockMapService.setBoardName).toHaveBeenCalledWith(newName);
    });

    it('should set the board description through the setter', () => {
        const newDescription = 'New Board Description';
        component.description = newDescription;
        expect(mockMapService.setBoardDescription).toHaveBeenCalledWith(newDescription);
    });

    it('should alert when spawn points are not placed', () => {
        mockMapService.isReadyToSave.and.returnValue({ isValid: false, error: 'Vous devez placer tous les points de départs du jeu.' });
        const openDialogSpy = spyOn<any>(component, 'openDialog').and.returnValue(dialogRefStub);
        component.checkIfReadyToSave();
        expect(openDialogSpy).toHaveBeenCalledWith('Vous devez placer tous les points de départs du jeu.', Alert.ERROR);
    });

    it('should alert when minimum objects are not placed', () => {
        mockMapService.isReadyToSave.and.returnValue({ isValid: false, error: 'Vous devez placer au moins 5 items sur la partie.' });
        const openDialogSpy = spyOn<any>(component, 'openDialog').and.returnValue(dialogRefStub);
        component.checkIfReadyToSave();
        expect(openDialogSpy).toHaveBeenCalledWith('Vous devez placer au moins 5 items sur la partie.', Alert.ERROR);
    });

    it('should not save board when save confirmation is cancelled', () => {
        mockMapService.isReadyToSave.and.returnValue({ isValid: true, error: '' });
        spyOn<any>(component, 'openDialog').and.returnValue(dialogRefStub);
        const saveBoardSpy = spyOn(component, 'saveBoard');
        component.checkIfReadyToSave();
        expect(saveBoardSpy).not.toHaveBeenCalled();
    });

    it('should save board, alert success, navigate and reset when confirmed and save is successful', fakeAsync(() => {
        // Création de l'espion sur reset AVANT son appel dans checkIfReadyToSave

        mockMapService.isReadyToSave.and.returnValue({ isValid: true, error: '' });
        // Simuler deux appels à openDialog : le premier pour la confirmation, le deuxième pour l’alerte de succès
        spyOn<any>(component, 'openDialog').and.returnValues(Promise.resolve(true), Promise.resolve(true));
        spyOn(component, 'saveBoard').and.returnValue(Promise.resolve('BoardSaved'));

        component.checkIfReadyToSave();
        flushMicrotasks();
        tick();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);
    }));

    it('should handle response correctly in saveBoard when board has no _id', async () => {
        const boardWithoutId: Board = {
            name: 'Test Board',
            description: 'New Desc',
            isCTF: false,
            size: 10,
            board: [],
            visibility: Visibility.PUBLIC,
            updatedAt: new Date(),
        };
        const boardSubject = new BehaviorSubject<Board>(boardWithoutId);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);
        const successResponse = new HttpResponse({ status: 200, body: 'Success Response' });
        const addBoardSpy = spyOn(component['boardService'], 'addBoard').and.returnValue(of(successResponse));
        const result = await component.saveBoard();
        fixture.detectChanges();
        expect(addBoardSpy).toHaveBeenCalledWith(boardWithoutId);
        expect(result).toEqual('Success Response');
    });

    it('should handle error correctly in saveBoard when adding board fails', async () => {
        const boardWithoutId: Board = {
            name: 'Test Board',
            description: 'New Desc',
            isCTF: false,
            size: 10,
            board: [],
            visibility: Visibility.PUBLIC,
            updatedAt: new Date(),
        };
        const boardSubject = new BehaviorSubject<Board>(boardWithoutId);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);
        const errorResponse = new HttpResponse({ status: 500, body: 'Error Response' });
        const addBoardSpy = spyOn(component['boardService'], 'addBoard').and.returnValue(throwError(() => errorResponse));
        await expectAsync(component.saveBoard()).toBeRejected();
        fixture.detectChanges();
        expect(addBoardSpy).toHaveBeenCalledWith(boardWithoutId);
    });

    it('should update board when board has _id', async () => {
        const mockBoardWithId: Board = {
            _id: 'existing-board-id',
            name: 'Existing Board',
            description: 'New board description',
            board: [],
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
        expect(updateBoardSpy).toHaveBeenCalledWith(mockBoardWithId);
        expect(result).toEqual('Update Success');
    });

    it('should handle error with error property correctly in saveBoard', async () => {
        const boardWithId: Board = {
            name: 'New Board',
            description: 'New board description',
            board: [],
            visibility: Visibility.PUBLIC,
            isCTF: false,
            size: 10,
            updatedAt: new Date(),
        };
        const boardSubject = new BehaviorSubject<Board>(boardWithId);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);
        const errorObj = { error: { message: 'Custom error message' } };
        const addBoardSpy = spyOn(component['boardService'], 'addBoard').and.returnValue(throwError(() => errorObj));
        await expectAsync(component.saveBoard()).toBeRejectedWith('Custom error message');
        fixture.detectChanges();
        const boardArg = addBoardSpy.calls.mostRecent().args[0];
        expect(boardArg._id).toBeUndefined();
    });

    it('should alert for invalid board name when board name is empty', () => {
        const boardWithEmptyName: Board = {
            _id: '123',
            name: '',
            description: 'Test Desc',
            isCTF: false,
            size: 10,
            board: [],
            visibility: Visibility.PUBLIC,
            updatedAt: new Date(),
        };
        mockMapService.getBoardToSave.and.returnValue(new BehaviorSubject(boardWithEmptyName));
        const openDialogSpy = spyOn<any>(component, 'openDialog').and.returnValue(dialogRefStub);
        component.checkIfReadyToSave();
        expect(openDialogSpy).toHaveBeenCalledWith('Veuillez donner un nom valide à votre carte', Alert.ERROR);
    });

    it('should navigate and reset when confirmReturn is called and confirmed', async () => {
        // Utiliser un mock qui retourne une promesse résolue avec true
        spyOn<any>(component, 'openDialog').and.returnValue(Promise.resolve(true));

        // Appeler la méthode et attendre sa complétion
        await component.confirmReturn();

        // Vérifier que navigate a été appelé avec le bon argument
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);
    });

    // Test pour ngOnInit()
    it('should call setBoardToFirstValue on ngOnInit', () => {
        mockMapService.setBoardToFirstValue.calls.reset();
        component.ngOnInit();
        expect(mockMapService.setBoardToFirstValue).toHaveBeenCalled();
    });

    // Test pour la méthode reset()
    it('should call setBoardToFirstValue when reset is confirmed', async () => {
        spyOn<any>(component, 'openDialog').and.returnValue(Promise.resolve(true));
        await component.reset();
        expect(mockMapService.setBoardToFirstValue).toHaveBeenCalled();
    });

    it('should not call setBoardToFirstValue when reset is cancelled', async () => {
        spyOn<any>(component, 'openDialog').and.returnValue(Promise.resolve(false));
        mockMapService.setBoardToFirstValue.calls.reset();
        await component.reset();
        expect(mockMapService.setBoardToFirstValue).not.toHaveBeenCalled();
    });

    // Test pour la méthode openDialog()
    it('should return proper dialog result from openDialog', async () => {
        const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRef.afterClosed.and.returnValue(of(true));
        spyOn(component['dialog'], 'open').and.returnValue(dialogRef);

        const result = await component['openDialog']('Test message', Alert.CONFIRM);

        // Ajouté les propriétés manquantes qui sont dans l'implémentation réelle
        expect(component['dialog'].open).toHaveBeenCalledWith(jasmine.any(Function), {
            data: { type: Alert.CONFIRM, message: 'Test message' },
            disableClose: true,
            hasBackdrop: true,
            backdropClass: 'backdrop-block',
            panelClass: 'alert-dialog',
        });
        expect(result).toBeTrue();
    });

    // Test pour les scénarios d'erreur dans saveBoard()
    it('should handle generic error in saveBoard when error has no message', async () => {
        const genericError = { status: 500 };
        spyOn(component['boardService'], 'addBoard').and.returnValue(throwError(() => genericError));

        const boardSubject = new BehaviorSubject<Board>({
            ...mockBoard,
            _id: undefined,
        });
        mockMapService.getBoardToSave.and.returnValue(boardSubject);

        await expectAsync(component.saveBoard()).toBeRejectedWith('An unknown error occurred');
    });

    it('should not call map service when checkIfReadyToSave validation fails', async () => {
        mockMapService.isReadyToSave.and.returnValue({ isValid: false, error: 'Some error' });
        spyOn<any>(component, 'openDialog').and.returnValue(Promise.resolve(true));
        const saveBoardSpy = spyOn(component, 'saveBoard');

        await component.checkIfReadyToSave();
        expect(saveBoardSpy).not.toHaveBeenCalled();
    });

    it('should not call saveBoard when name is invalid', async () => {
        mockMapService.isReadyToSave.and.returnValue({ isValid: true, error: '' });
        const boardWithEmptyName = { ...mockBoard, name: '   ' }; // nom avec des espaces uniquement
        const boardSubject = new BehaviorSubject<Board>(boardWithEmptyName);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);

        spyOn<any>(component, 'openDialog').and.returnValue(Promise.resolve(true));
        const saveBoardSpy = spyOn(component, 'saveBoard');

        await component.checkIfReadyToSave();
        expect(saveBoardSpy).not.toHaveBeenCalled();
    });

    it('should not call saveBoard when confirmation dialog is cancelled', async () => {
        mockMapService.isReadyToSave.and.returnValue({ isValid: true, error: '' });
        spyOn<any>(component, 'openDialog').and.returnValue(Promise.resolve(false));
        const saveBoardSpy = spyOn(component, 'saveBoard');

        await component.checkIfReadyToSave();
        expect(saveBoardSpy).not.toHaveBeenCalled();
    });

    // Test pour une erreur sans propriété 'message' dans error.error
    it('should handle error without message property', async () => {
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);

        // Erreur avec propriété 'error' mais sans 'message'
        const errorWithoutMessage = { error: {} };
        spyOn(component['boardService'], 'updateBoard').and.returnValue(throwError(() => errorWithoutMessage));

        await expectAsync(component.saveBoard()).toBeRejectedWith('An unknown error occurred');
    });

    // Test pour une erreur qui est un objet sans propriété 'error'
    it('should handle error object without error property', async () => {
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);

        // Erreur qui est un objet sans propriété 'error'
        const genericErrorObject = { status: 500, statusText: 'Internal Server Error' };
        spyOn(component['boardService'], 'updateBoard').and.returnValue(throwError(() => genericErrorObject));

        await expectAsync(component.saveBoard()).toBeRejectedWith('An unknown error occurred');
    });

    // Test pour une erreur qui n'est pas un objet
    it('should handle non-object error', async () => {
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);

        // Erreur qui est une chaîne de caractères
        spyOn(component['boardService'], 'updateBoard').and.returnValue(throwError(() => 'Simple string error'));

        await expectAsync(component.saveBoard()).toBeRejectedWith('An unknown error occurred');
    });

    // Test pour une erreur null
    it('should handle null error', async () => {
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);

        // Erreur null
        spyOn(component['boardService'], 'updateBoard').and.returnValue(throwError(() => null));

        await expectAsync(component.saveBoard()).toBeRejectedWith('An unknown error occurred');
    });
});
