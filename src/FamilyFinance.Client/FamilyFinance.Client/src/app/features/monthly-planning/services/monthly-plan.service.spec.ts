import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MonthlyPlanService, DEFAULT_PREDEFINED_JARS } from './monthly-plan.service';
import { environment } from '../../../../environments/environment';
import { BudgetPlanResponse, DefaultJarsResponse } from '../../../shared/models/api.model';
import { Expense } from '../../expenses/models/expense.model';

describe('MonthlyPlanService', () => {
  let service: MonthlyPlanService;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/budget-plans`;

  const mockPlanResponse: BudgetPlanResponse = {
    id: 1,
    year: 2026,
    month: 10,
    monthlyIncomeVnd: '30000000',
    currency: 'VND',
    createdAtUtc: new Date().toISOString(),
    jars: [
      { jarType: 'livingExpenses', name: 'Living Expenses', percentage: 35, budgetVnd: '10500000' },
      { jarType: 'food', name: 'Food', percentage: 20, budgetVnd: '6000000' },
      { jarType: 'children', name: 'Children', percentage: 10, budgetVnd: '3000000' },
      { jarType: 'emergencyFund', name: 'Emergency Fund', percentage: 10, budgetVnd: '3000000' },
      { jarType: 'savings', name: 'Savings', percentage: 10, budgetVnd: '3000000' },
      { jarType: 'investment', name: 'Investment', percentage: 10, budgetVnd: '3000000' },
      { jarType: 'entertainmentAndTravel', name: 'Entertainment & Travel', percentage: 5, budgetVnd: '1500000' },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MonthlyPlanService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(MonthlyPlanService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created and return default jars', () => {
    expect(service).toBeTruthy();
    expect(service.getDefaultJars().length).toBe(7);
  });

  describe('fetchDefaultJars', () => {
    it('should call GET /api/budget-plans/default-jars and map response', () => {
      const mockResponse: DefaultJarsResponse = {
        currency: 'VND',
        totalPercentage: 100,
        jars: [
          { jarType: 'livingExpenses', name: 'Living Expenses', percentage: 35, suggestedLogic: '' },
          { jarType: 'food', name: 'Food', percentage: 20, suggestedLogic: '' },
        ],
      };

      service.fetchDefaultJars().subscribe((jars) => {
        expect(jars.length).toBe(2);
        expect(jars[0].key).toBe('living');
        expect(jars[0].defaultRate).toBe(35);
      });

      const req = httpTesting.expectOne(`${baseUrl}/default-jars`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createPlan', () => {
    it('should POST /api/budget-plans with year, month, and monthlyIncome', () => {
      service.createPlan(2026, 11, 40000000).subscribe((plan) => {
        expect(plan.year).toBe(2026);
        expect(plan.month).toBe(11);
        expect(plan.income).toBe(40000000);
        expect(plan.jars.length).toBe(7);

        const living = plan.jars.find((j) => j.key === 'living');
        expect(living?.allocatedAmount).toBe(14000000);
      });

      const req = httpTesting.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        year: 2026,
        month: 11,
        monthlyIncome: 40000000,
        monthlyIncomeVnd: '40000000',
      });

      req.flush({
        ...mockPlanResponse,
        year: 2026,
        month: 11,
        monthlyIncomeVnd: '40000000',
        jars: [
          { jarType: 'livingExpenses', name: 'Living Expenses', percentage: 35, budgetVnd: '14000000' },
          { jarType: 'food', name: 'Food', percentage: 20, budgetVnd: '8000000' },
          { jarType: 'children', name: 'Children', percentage: 10, budgetVnd: '4000000' },
          { jarType: 'emergencyFund', name: 'Emergency Fund', percentage: 10, budgetVnd: '4000000' },
          { jarType: 'savings', name: 'Savings', percentage: 10, budgetVnd: '4000000' },
          { jarType: 'investment', name: 'Investment', percentage: 10, budgetVnd: '4000000' },
          { jarType: 'entertainmentAndTravel', name: 'Entertainment & Travel', percentage: 5, budgetVnd: '2000000' },
        ],
      });
    });
  });

  describe('getPlanByMonth', () => {
    it('should GET /api/budget-plans with year and month query params', () => {
      service.getPlanByMonth(2026, 10).subscribe((plan) => {
        expect(plan.id).toBe('1');
        expect(plan.year).toBe(2026);
        expect(plan.month).toBe(10);
        expect(plan.income).toBe(30000000);
        expect(service.currentPlan()).toEqual(plan);
      });

      const req = httpTesting.expectOne(`${baseUrl}?year=2026&month=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPlanResponse);
    });
  });

  describe('applyExpense & calculateAllocations', () => {
    it('should calculate allocations accurately', () => {
      const allocations = service.calculateAllocations(30000000);
      expect(allocations.length).toBe(7);
      const living = allocations.find((j) => j.key === 'living');
      expect(living?.allocatedAmount).toBe(10500000);
    });

    it('should deduct amount from target jar when applyExpense is called', () => {
      service.createPlan(2026, 10, 30000000).subscribe();
      const req = httpTesting.expectOne(baseUrl);
      req.flush(mockPlanResponse);

      const expense: Expense = {
        id: 'exp-1',
        planId: '1',
        jarKey: 'food',
        amount: 500000,
        date: '2026-10-12',
        note: 'Supermarket',
        createdAt: new Date().toISOString(),
      };

      service.applyExpense(expense);

      const updated = service.getPlan(2026, 10);
      const foodJar = updated?.jars.find((j) => j.key === 'food');
      expect(foodJar?.spentAmount).toBe(500000);
      expect(foodJar?.remainingAmount).toBe(5500000);
    });
  });
});
