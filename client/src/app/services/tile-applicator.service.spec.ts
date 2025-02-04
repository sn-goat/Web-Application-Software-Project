import { TestBed } from '@angular/core/testing';

import { TileApplicatorService } from './tile-applicator.service';

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
