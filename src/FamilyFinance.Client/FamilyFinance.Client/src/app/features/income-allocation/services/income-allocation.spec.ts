import { TestBed } from '@angular/core/testing';
import { IncomeAllocation } from './income-allocation';

describe('IncomeAllocation', () => {
  let service: IncomeAllocation;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IncomeAllocation);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
