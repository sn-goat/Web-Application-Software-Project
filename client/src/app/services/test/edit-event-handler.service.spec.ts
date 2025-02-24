import { TestBed } from '@angular/core/testing';

import { EditEventHandlerService } from '../code/edit-event-handler.service';

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
