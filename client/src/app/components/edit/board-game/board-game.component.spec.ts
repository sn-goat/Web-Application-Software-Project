import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapService } from '@app/services/code/map.service';
import { TileApplicatorService } from '@app/services/code/tile-applicator.service';
import { Board } from '@common/board';
import { BehaviorSubject } from 'rxjs';
import { BoardGameComponent } from './board-game.component';

describe('BoardGameComponent', () => {
    let component: BoardGameComponent;
    let fixture: ComponentFixture<BoardGameComponent>;
    let mapService: jasmine.SpyObj<MapService>;
    let tileApplicatorService: jasmine.SpyObj<TileApplicatorService>;
    const POINTER_POSITION = 100;

    beforeEach(async () => {
        const mapServiceSpy = jasmine.createSpyObj('MapService', ['initializeBoard', 'getBoardToSave']);
        const tileApplicatorServiceSpy = jasmine.createSpyObj('TileApplicatorService', [
            'handleMouseDown',
            'handleMouseUp',
            'handleMouseLeave',
            'handleMouseMove',
            'handleDrop',
            'setItemOutsideBoard',
        ]);

        await TestBed.configureTestingModule({
            imports: [BoardGameComponent],
            providers: [
                { provide: MapService, useValue: mapServiceSpy },
                { provide: TileApplicatorService, useValue: tileApplicatorServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BoardGameComponent);
        component = fixture.componentInstance;
        mapService = TestBed.inject(MapService) as jasmine.SpyObj<MapService>;
        tileApplicatorService = TestBed.inject(TileApplicatorService) as jasmine.SpyObj<TileApplicatorService>;
        mapService.getBoardToSave.and.returnValue(new BehaviorSubject<Board>({} as Board));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize board on init', () => {
        component.ngOnInit();
        expect(mapService.getBoardToSave).toHaveBeenCalled();
    });

    it('should handle mousedown event', () => {
        const event = new MouseEvent('mousedown');
        spyOn(component.elRef.nativeElement, 'getBoundingClientRect').and.returnValue({} as DOMRect);
        component.onMouseDown(event);
        expect(tileApplicatorService.handleMouseDown).toHaveBeenCalledWith(event, jasmine.any(Object));
    });

    it('should handle mouseup event', () => {
        const event = new MouseEvent('mouseup');
        component.onMouseUp(event);
        expect(tileApplicatorService.handleMouseUp).toHaveBeenCalledWith(event);
    });

    it('should handle mouseleave event', () => {
        component.onMouseLeave();
        expect(tileApplicatorService.handleMouseLeave).toHaveBeenCalled();
    });

    it('should handle mousemove event', () => {
        spyOn(component.elRef.nativeElement, 'getBoundingClientRect').and.returnValue({} as DOMRect);
        component.onMouseMove();
        expect(tileApplicatorService.handleMouseMove).toHaveBeenCalledWith(jasmine.any(Object));
    });

    it('should handle drop event', () => {
        const event = new DragEvent('drop');
        spyOn(event, 'preventDefault');
        spyOn(component.elRef.nativeElement, 'getBoundingClientRect').and.returnValue({} as DOMRect);
        component.onDrop(event);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(tileApplicatorService.handleDrop).toHaveBeenCalledWith(jasmine.any(Object));
    });

    it('should handle dragend event', () => {
        const event = new DragEvent('dragend', { clientX: POINTER_POSITION, clientY: POINTER_POSITION });
        spyOn(event, 'preventDefault');
        spyOn(component.elRef.nativeElement, 'getBoundingClientRect').and.returnValue({} as DOMRect);
        component.onDragOver(event);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(tileApplicatorService.setItemOutsideBoard).toHaveBeenCalledWith(POINTER_POSITION, POINTER_POSITION, jasmine.any(Object));
    });
});
