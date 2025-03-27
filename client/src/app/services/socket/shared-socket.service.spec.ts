import { TestBed } from '@angular/core/testing';

import { SharedSocketService } from './shared-socket.service';

describe('SharedSocketService', () => {
  let service: SharedSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
