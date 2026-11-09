import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ExpenseService } from './expense.service';
import { MonthlyPlanService } from '../../monthly-planning/services/monthly-plan.service';
import { environment } from '../../../../environments/environment';
import { CreateExpenseResponse, SpendingByJarsResponse } from '../../../shared/models/api.model';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let planService: MonthlyPlanService;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/budget-plans`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExpenseService,
        MonthlyPlanService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ExpenseService);
    planService = TestBed.inject(MonthlyPlanService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created with initial empty expenses signal', () => {
    expect(service).toBeTruthy();
    expect(service.expenses()).toEqual([]);
  });

  describe('recordExpense', () => {
    it('should POST /api/budget-plans/{planId}/expenses with mapped payload and update signals', () => {
      const mockResponse: CreateExpenseResponse = {
        expense: {
          id: 42,
          expenseDate: '2026-10-15',
          jarType: 'food',
          jarName: 'Food',
          amountVnd: '250000',
          description: 'Weekly groceries',
          createdAtUtc: new Date().toISOString(),
        },
        jarSummary: {
          jarType: 'food',
          jarName: 'Food',
          percentage: 20,
          budgetVnd: '6000000',
          spentVnd: '250000',
          remainingVnd: '5750000',
        },
      };

      service
        .recordExpense('1', {
          jarKey: 'food',
          amount: 250000,
          date: '2026-10-15',
          note: 'Weekly groceries',
        })
        .subscribe((savedExpense) => {
          expect(savedExpense.id).toBe('42');
          expect(savedExpense.planId).toBe('1');
          expect(savedExpense.jarKey).toBe('food');
          expect(savedExpense.amount).toBe(250000);
          expect(savedExpense.note).toBe('Weekly groceries');
        });

      const req = httpTesting.expectOne(`${baseUrl}/1/expenses`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.amount).toBe(250000);
      expect(req.request.body.jarKey).toBe('food');
      expect(req.request.body.jarType).toBe('food');
      expect(req.request.body.date).toBe('2026-10-15');
      expect(req.request.body.note).toBe('Weekly groceries');

      req.flush(mockResponse);

      expect(service.expenses().length).toBe(1);
      expect(service.expenses()[0].id).toBe('42');
    });
  });

  describe('getSpendingByJars', () => {
    it('should GET /api/budget-plans/{planId}/spending-by-jars and update plan stats', () => {
      const mockStats: SpendingByJarsResponse = {
        year: 2026,
        month: 10,
        currency: 'VND',
        jars: [
          {
            jarType: 'food',
            jarName: 'Food',
            percentageUsed: 50,
            plannedBudgetVnd: '6000000',
            spentBudgetVnd: '3000000',
          },
        ],
      };

      service.getSpendingByJars('1').subscribe((stats) => {
        expect(stats.year).toBe(2026);
        expect(stats.month).toBe(10);
        expect(stats.jars[0].percentageUsed).toBe(50);
      });

      const req = httpTesting.expectOne(`${baseUrl}/1/spending-by-jars`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });
});
