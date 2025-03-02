import { TestBed } from '@angular/core/testing';

import { PlayerToolsService } from '@app/services/code/player-tools.service';

describe('PlayerToolsService', () => {
    let service: PlayerToolsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PlayerToolsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
