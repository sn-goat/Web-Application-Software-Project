import { TestBed } from '@angular/core/testing';

import { PlayerService } from '@app/services/code/player.service';

describe('PlayerService', () => {
    let service: PlayerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PlayerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
