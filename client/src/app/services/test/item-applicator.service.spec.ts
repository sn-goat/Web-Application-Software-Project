import { TestBed } from '@angular/core/testing';

import { ItemApplicatorService } from '@app/services/code/item-applicator.service';

describe('ItemApplicatorService', () => {
    let service: ItemApplicatorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ItemApplicatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
