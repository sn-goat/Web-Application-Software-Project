import { TestBed } from '@angular/core/testing';

import { TileApplicatorService } from '@app/services/code/tile-applicator.service';

describe('TileApplicatorService', () => {
    let service: TileApplicatorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TileApplicatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
