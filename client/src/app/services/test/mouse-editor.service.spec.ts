/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { MouseEditorService } from '@app/services/code/mouse-editor.service';
import { take } from 'rxjs/operators';

describe('MouseEditorService', () => {
    let service: MouseEditorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MouseEditorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should update coordinates when updateCoordinate is called', (done) => {
        const mockEvent = { pageX: 100, pageY: 200 } as MouseEvent;

        service.updateCoordinate(mockEvent);

        service['currentCoord'].pipe(take(1)).subscribe((coord) => {
            expect(coord.x).toBe(100);
            expect(coord.y).toBe(200);
            done();
        });
    });

    it('should prevent default action on right-click', () => {
        const mockEvent = new MouseEvent('contextmenu');
        spyOn(mockEvent, 'preventDefault');

        service.preventRightClick(mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
});
