import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MapService } from '@app/services/map.service';
import { Board } from '@common/board';
import { BehaviorSubject } from 'rxjs';
import { MapMakerComponent } from './map-maker.component';

describe('MapMakerComponent', () => {
    let component: MapMakerComponent;
    let fixture: ComponentFixture<MapMakerComponent>;
    let mockMapService: jasmine.SpyObj<MapService>;
    let mockRouter: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        mockMapService = jasmine.createSpyObj('MapService', ['getBoardToSave', 'setBoardName', 'setBoardDescription']);

        const mockBoard = {
            _id: '123',
            name: 'Test Board',
            description: 'A sample board',
            isCTF: false,
            size: 10,
        } as Board;
        const boardSubject = new BehaviorSubject<Board>(mockBoard);
        mockMapService.getBoardToSave.and.returnValue(boardSubject);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [MapMakerComponent],
            providers: [provideHttpClient(), provideHttpClientTesting],
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
        spyOn(window, 'confirm').and.returnValue(false); // Mock cancel
        component.confirmReturn();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should set the board name through set name method', () => {
        const newName = 'New Board Name';
        component.name = newName;
        expect(mockMapService.setBoardName(newName)).toHaveBeenCalledWith(newName);
    });

    it('should set the board description through set description method', () => {
        const newDescription = 'New Board Description';
        component.description = newDescription;
        expect(mockMapService.setBoardDescription(newDescription)).toHaveBeenCalledWith(newDescription);
    });
});
