import { TestBed } from '@angular/core/testing';
import { ExpenseService } from './expense.service';
import { MonthlyPlanService } from '../../monthly-planning/services/monthly-plan.service';

describe('ExpenseService', () => {
  let expenseService: ExpenseService;
  let planService: MonthlyPlanService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExpenseService, MonthlyPlanService],
    });
    expenseService = TestBed.inject(ExpenseService);
    planService = TestBed.inject(MonthlyPlanService);

    // Create a known plan for testing: 2026-09 with 10M income
    planService.createPlan(2026, 9, 10000000);
  });

  describe('Validation & Boundary Tests', () => {
    it('should reject zero amount (amount === 0)', () => {
      const result = expenseService.recordExpense({
        date: '2026-09-15',
        jarKey: 'food',
        amount: 0,
        note: 'Zero expense',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Amount must be a positive whole-VND value.');
      expect(expenseService.expenses().length).toBe(0);
    });

    it('should reject negative amount (amount < 0)', () => {
      const result = expenseService.recordExpense({
        date: '2026-09-15',
        jarKey: 'food',
        amount: -50000,
        note: 'Negative expense',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Amount must be a positive whole-VND value.');
      expect(expenseService.expenses().length).toBe(0);
    });

    it('should reject non-integer / fractional VND amounts', () => {
      const result = expenseService.recordExpense({
        date: '2026-09-15',
        jarKey: 'food',
        amount: 125000.5,
        note: 'Fractional expense',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Amount must be a positive whole-VND value.');
      expect(expenseService.expenses().length).toBe(0);
    });

    it('should reject empty or whitespace-only description/note', () => {
      const emptyResult = expenseService.recordExpense({
        date: '2026-09-15',
        jarKey: 'food',
        amount: 100000,
        note: '',
      });
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.error).toBe('Description is required.');

      const whitespaceResult = expenseService.recordExpense({
        date: '2026-09-15',
        jarKey: 'food',
        amount: 100000,
        note: '    ',
      });
      expect(whitespaceResult.success).toBe(false);
      expect(whitespaceResult.error).toBe('Description is required.');
    });

    it('should reject expense date when NO plan exists for that year/month', () => {
      // 2028-05 has no plan created
      const result = expenseService.recordExpense({
        date: '2028-05-20',
        jarKey: 'food',
        amount: 150000,
        note: 'Future dinner',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No monthly plan exists for 2028-05');
      expect(expenseService.expenses().length).toBe(0);
    });

    it('should reject if jarKey does not exist in the active plan', () => {
      const result = expenseService.recordExpense({
        date: '2026-09-15',
        jarKey: 'invalid-jar' as any,
        amount: 100000,
        note: 'Invalid jar expense',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('selected jar does not belong to this monthly plan');
    });
  });

  describe('Happy Path & Over-budget Scenarios', () => {
    it('should successfully record valid expense and update both expense signal and target jar totals', () => {
      const result = expenseService.recordExpense({
        date: '2026-09-15',
        jarKey: 'food',
        amount: 250000,
        note: 'Groceries at market',
      });

      expect(result.success).toBe(true);
      expect(result.expense).toBeDefined();
      expect(result.expense?.amount).toBe(250000);
      expect(result.expense?.planId).toBe('2026-09');

      expect(expenseService.expenses().length).toBe(1);
      expect(expenseService.expenses()[0].note).toBe('Groceries at market');

      const plan = planService.getPlan(2026, 9)!;
      const food = plan.jars.find((j) => j.key === 'food')!;
      expect(food.spentAmount).toBe(250000);
      // Food budget: 20% of 10M = 2,000,000; remaining = 1,750,000
      expect(food.remainingAmount).toBe(1750000);
    });

    it('should accept the minimum positive whole-VND amount (1 VND)', () => {
      const result = expenseService.recordExpense({
        date: '2026-09-01',
        jarKey: 'travel',
        amount: 1,
        note: 'Candy coin',
      });

      expect(result.success).toBe(true);
      const plan = planService.getPlan(2026, 9)!;
      const travel = plan.jars.find((j) => j.key === 'travel')!;
      expect(travel.spentAmount).toBe(1);
    });

    it('should allow over-budget expense recording and set negative remaining balance properly', () => {
      // Entertainment & Travel budget: 5% of 10M = 500,000 VND
      const result = expenseService.recordExpense({
        date: '2026-09-25',
        jarKey: 'travel',
        amount: 800000, // 300,000 over budget
        note: 'Weekend vacation trip',
      });

      expect(result.success).toBe(true);
      const plan = planService.getPlan(2026, 9)!;
      const travel = plan.jars.find((j) => j.key === 'travel')!;
      expect(travel.spentAmount).toBe(800000);
      expect(travel.remainingAmount).toBe(-300000);
    });
  });
});
