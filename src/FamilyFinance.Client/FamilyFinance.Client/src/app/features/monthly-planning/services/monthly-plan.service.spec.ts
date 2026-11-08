import { TestBed } from '@angular/core/testing';
import { MonthlyPlanService } from './monthly-plan.service';
import { Expense } from '../../expenses/models/expense.model';

describe('MonthlyPlanService', () => {
  let service: MonthlyPlanService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MonthlyPlanService],
    });
    service = TestBed.inject(MonthlyPlanService);
  });

  it('should be created and initialized with the default seeded plan (October 2026)', () => {
    expect(service).toBeTruthy();
    const current = service.currentPlan();
    expect(current).not.toBeNull();
    expect(current?.year).toBe(2026);
    expect(current?.month).toBe(10);
    expect(current?.income).toBe(30000000);
    expect(current?.jars.length).toBe(7);
  });

  describe('createPlan', () => {
    it('should allocate income across 7 jars with exact rates summing to 100%', () => {
      const plan = service.createPlan(2026, 11, 40000000);

      expect(plan.year).toBe(2026);
      expect(plan.month).toBe(11);
      expect(plan.income).toBe(40000000);
      expect(plan.jars.length).toBe(7);

      const totalRates = plan.jars.reduce((sum, j) => sum + j.defaultRate, 0);
      expect(totalRates).toBe(100);

      const living = plan.jars.find((j) => j.key === 'living');
      const food = plan.jars.find((j) => j.key === 'food');
      const children = plan.jars.find((j) => j.key === 'children');
      const emergency = plan.jars.find((j) => j.key === 'emergency');
      const savings = plan.jars.find((j) => j.key === 'savings');
      const investment = plan.jars.find((j) => j.key === 'investment');
      const travel = plan.jars.find((j) => j.key === 'travel');

      expect(living?.allocatedAmount).toBe(14000000); // 35% of 40M
      expect(food?.allocatedAmount).toBe(8000000); // 20% of 40M
      expect(children?.allocatedAmount).toBe(4000000); // 10% of 40M
      expect(emergency?.allocatedAmount).toBe(4000000); // 10% of 40M
      expect(savings?.allocatedAmount).toBe(4000000); // 10% of 40M
      expect(investment?.allocatedAmount).toBe(4000000); // 10% of 40M
      expect(travel?.allocatedAmount).toBe(2000000); // 5% of 40M

      const totalAllocated = plan.jars.reduce((sum, j) => sum + j.allocatedAmount, 0);
      expect(totalAllocated).toBe(40000000);
    });

    it('should round whole-VND amounts for odd incomes correctly', () => {
      const plan = service.createPlan(2026, 12, 33333333);

      plan.jars.forEach((jar) => {
        expect(Number.isInteger(jar.allocatedAmount)).toBe(true);
      });

      const living = plan.jars.find((j) => j.key === 'living');
      expect(living?.allocatedAmount).toBe(Math.round((33333333 * 35) / 100));
    });

    it('should replace previous plan if creating for the same year and month', () => {
      service.createPlan(2027, 1, 20000000);
      expect(service.getPlan(2027, 1)?.income).toBe(20000000);

      service.createPlan(2027, 1, 25000000);
      const updated = service.getPlan(2027, 1);
      expect(updated?.income).toBe(25000000);
      expect(service.plans().filter((p) => p.year === 2027 && p.month === 1).length).toBe(1);
    });
  });

  describe('applyExpense', () => {
    it('should deduct amount from target jar and update spentAmount and remainingAmount', () => {
      const plan = service.createPlan(2026, 9, 10000000);
      // Food budget: 20% of 10M = 2,000,000 VND
      const foodJar = plan.jars.find((j) => j.key === 'food')!;
      expect(foodJar.spentAmount).toBe(0);
      expect(foodJar.remainingAmount).toBe(2000000);

      const expense: Expense = {
        id: 'test-exp-1',
        planId: plan.id,
        jarKey: 'food',
        amount: 350000,
        date: '2026-09-10',
        note: 'Supermarket shopping',
        createdAt: new Date().toISOString(),
      };

      service.applyExpense(expense);

      const refreshedPlan = service.getPlan(2026, 9)!;
      const updatedFoodJar = refreshedPlan.jars.find((j) => j.key === 'food')!;
      expect(updatedFoodJar.spentAmount).toBe(350000);
      expect(updatedFoodJar.remainingAmount).toBe(1650000);
    });
  });
});
