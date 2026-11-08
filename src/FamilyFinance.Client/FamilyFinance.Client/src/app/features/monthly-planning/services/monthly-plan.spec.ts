import { TestBed } from '@angular/core/testing';
import { MonthlyPlan } from './monthly-plan';

describe('MonthlyPlan', () => {
  let service: MonthlyPlan;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MonthlyPlan);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
