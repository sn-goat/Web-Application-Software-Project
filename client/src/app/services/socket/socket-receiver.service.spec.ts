import { TestBed } from '@angular/core/testing';

import { SocketReceiverService } from './socket-receiver.service';

describe('SocketReceiverService', () => {
    let service: SocketReceiverService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SocketReceiverService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
