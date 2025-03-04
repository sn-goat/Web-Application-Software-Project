import { TestBed } from '@angular/core/testing';

import { FightLogicService } from '@app/services/code/fight-logic.service';

describe('FightLogicService', () => {
    let service: FightLogicService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(FightLogicService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
