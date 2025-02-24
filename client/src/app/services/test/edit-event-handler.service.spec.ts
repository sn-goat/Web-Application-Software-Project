import { TestBed } from '@angular/core/testing';

import { EditEventHandlerService } from '@app/services/code/edit-event-handler.service';

describe('EditEventHandlerService', () => {
    let service: EditEventHandlerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(EditEventHandlerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
