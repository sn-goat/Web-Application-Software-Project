import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditEventHandlerService } from '@app/services/code/edit-event-handler.service';
import { MapService } from '@app/services/code/map.service';
import { Board } from '@common/board';
import { BehaviorSubject } from 'rxjs';
import { BoardGameComponent } from './board-game.component';

describe('BoardGameComponent', () => {
    let component: BoardGameComponent;
    let fixture: ComponentFixture<BoardGameComponent>;
    let mapServiceSpy: jasmine.SpyObj<MapService>;
    let editEventHandlerServiceSpy: jasmine.SpyObj<EditEventHandlerService>;

    beforeEach(async () => {
        const mapSpy = jasmine.createSpyObj('MapService', ['getBoardToSave']);
        const editEventHandlerSpy = jasmine.createSpyObj('EditEventHandlerService', [
            'handleMouseDown',
            'handleMouseUp',
            'handleMouseMove',
            'handleDragEnd',
        ]);

        await TestBed.configureTestingModule({
            imports: [BoardGameComponent],
            providers: [
                { provide: MapService, useValue: mapSpy },
                { provide: EditEventHandlerService, useValue: editEventHandlerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BoardGameComponent);
        component = fixture.componentInstance;
        mapServiceSpy = TestBed.inject(MapService) as jasmine.SpyObj<MapService>;
        editEventHandlerServiceSpy = TestBed.inject(EditEventHandlerService) as jasmine.SpyObj<EditEventHandlerService>;

        // Make getBoardToSave return a BehaviorSubject so that boardGame is updated
        mapServiceSpy.getBoardToSave.and.returnValue(new BehaviorSubject<Board>({} as Board));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should subscribe to board changes on init', () => {
        component.ngOnInit();
        expect(mapServiceSpy.getBoardToSave).toHaveBeenCalled();
    });

    it('should call handleMouseDown on mousedown event', () => {
        const event = new MouseEvent('mousedown');
        spyOn(component.elRef.nativeElement, 'getBoundingClientRect').and.returnValue({
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            right: 100,
            bottom: 100,
        } as DOMRect);
        component.onMouseDown(event);
        expect(editEventHandlerServiceSpy.handleMouseDown).toHaveBeenCalledWith(event, jasmine.any(Object));
    });

    it('should call handleMouseUp on mouseup event', () => {
        const event = new MouseEvent('mouseup');
        component.onMouseUp(event);
        expect(editEventHandlerServiceSpy.handleMouseUp).toHaveBeenCalledWith(event);
    });

    it('should call handleMouseMove on mousemove event', () => {
        const event = new MouseEvent('mousemove');
        spyOn(component.elRef.nativeElement, 'getBoundingClientRect').and.returnValue({
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            right: 100,
            bottom: 100,
        } as DOMRect);
        component.onMouseMove(event);
        expect(editEventHandlerServiceSpy.handleMouseMove).toHaveBeenCalledWith(event, jasmine.any(Object));
    });

    it('should call handleDragEnd on dragend event', () => {
        const event = new DragEvent('dragend', { clientX: 50, clientY: 50 });
        spyOn(component.elRef.nativeElement, 'getBoundingClientRect').and.returnValue({
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            right: 100,
            bottom: 100,
        } as DOMRect);
        component.onDragEnd(event);
        expect(editEventHandlerServiceSpy.handleDragEnd).toHaveBeenCalledWith(event, jasmine.any(Object));
    });
});
