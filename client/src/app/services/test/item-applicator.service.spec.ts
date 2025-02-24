import { TestBed } from '@angular/core/testing';

import { ItemApplicatorService } from './item-applicator.service';

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
