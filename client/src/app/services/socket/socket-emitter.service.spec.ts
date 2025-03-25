import { TestBed } from '@angular/core/testing';

import { SocketEmitterService } from './socket-emitter.service';

describe('SocketEmitterService', () => {
  let service: SocketEmitterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SocketEmitterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
