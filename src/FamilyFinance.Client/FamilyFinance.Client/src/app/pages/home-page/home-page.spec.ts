import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { HomePage } from './home-page';
import { MonthlyPlanService } from '../../features/monthly-planning/services/monthly-plan.service';
import { ExpenseService } from '../../features/expenses/services/expense.service';
import { MonthlyPlan } from '../../features/monthly-planning/models/monthly-plan.model';
import { signal } from '@angular/core';

describe('HomePage (Monthly Dashboard)', () => {
  let fixture: ComponentFixture<HomePage>;
  let component: HomePage;
  let planService: MonthlyPlanService;
  let expenseService: ExpenseService;

  const mockPlan: MonthlyPlan = {
    id: '1',
    year: 2026,
    month: 10,
    income: 30000000,
    createdAt: new Date().toISOString(),
    jars: [
      { id: '1', name: 'Living Expenses', key: 'living', defaultRate: 35, allocatedAmount: 10500000, spentAmount: 0, remainingAmount: 10500000 },
      { id: '2', name: 'Food', key: 'food', defaultRate: 20, allocatedAmount: 6000000, spentAmount: 0, remainingAmount: 6000000 },
      { id: '3', name: 'Children', key: 'children', defaultRate: 10, allocatedAmount: 3000000, spentAmount: 0, remainingAmount: 3000000 },
      { id: '4', name: 'Emergency Fund', key: 'emergency', defaultRate: 10, allocatedAmount: 3000000, spentAmount: 0, remainingAmount: 3000000 },
      { id: '5', name: 'Savings', key: 'savings', defaultRate: 10, allocatedAmount: 3000000, spentAmount: 0, remainingAmount: 3000000 },
      { id: '6', name: 'Investment', key: 'investment', defaultRate: 10, allocatedAmount: 3000000, spentAmount: 0, remainingAmount: 3000000 },
      { id: '7', name: 'Entertainment & Travel', key: 'travel', defaultRate: 5, allocatedAmount: 1500000, spentAmount: 0, remainingAmount: 1500000 },
    ],
  };

  beforeEach(async () => {
    const expensesSignalMock = signal<any[]>([]);

    const planServiceMock = {
      getPlan: vi.fn((year: number, month: number) => (year === 2026 && month === 10 ? mockPlan : undefined)),
      getPlanByMonth: vi.fn((year: number, month: number) =>
        year === 2026 && month === 10 ? of(mockPlan) : throwError(() => new Error('Not found'))
      ),
    };

    const expenseServiceMock = {
      expenses: expensesSignalMock.asReadonly(),
      getSpendingByJars: vi.fn().mockReturnValue(of({ year: 2026, month: 10, currency: 'VND', jars: [] })),
      recordExpense: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: MonthlyPlanService, useValue: planServiceMock },
        { provide: ExpenseService, useValue: expenseServiceMock },
        provideRouter([]),
      ],
    }).compileComponents();

    planService = TestBed.inject(MonthlyPlanService);
    expenseService = TestBed.inject(ExpenseService);

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    component.selectedYear.set(2026);
    component.selectedMonth.set(10);
    component.activePlan.set(mockPlan);
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  describe('Empty State', () => {
    it('should display "No monthly plan" empty state when no plan exists for the selected period', () => {
      component.selectedMonth.set(1);
      component.activePlan.set(null);
      fixture.detectChanges();

      expect(component.activePlan()).toBeNull();
      const emptyCard = fixture.nativeElement.querySelector('.empty-dashboard-state');
      expect(emptyCard).toBeTruthy();
      expect(emptyCard.textContent).toContain('No monthly plan for January 2026');

      const ctaBtn = emptyCard.querySelector('.primary-link');
      expect(ctaBtn).toBeTruthy();
      expect(ctaBtn.textContent).toContain('Create plan now');
    });
  });

  describe('Active Plan & KPI Metrics', () => {
    it('should correctly render KPI summary cards with initial figures', () => {
      expect(component.totalIncome()).toBe(30000000);
      expect(component.totalSpent()).toBe(0);
      expect(component.remainingBalance()).toBe(30000000);
      expect(component.overallProgress()).toBe(0);

      const cards = fixture.nativeElement.querySelectorAll('.summary-card');
      expect(cards.length).toBe(3);
      expect(cards[0].textContent).toContain('30,000,000');
      expect(cards[1].textContent).toContain('30,000,000');
      expect(cards[2].textContent).toContain('0');
      expect(cards[2].textContent).toContain('0% of income');
    });

    it('should dynamically update KPI cards and overall progress when plan has spent amounts', () => {
      const planWithExpense: MonthlyPlan = {
        ...mockPlan,
        jars: mockPlan.jars.map((j) =>
          j.key === 'food'
            ? { ...j, spentAmount: 3000000, remainingAmount: 3000000 }
            : j
        ),
      };

      component.activePlan.set(planWithExpense);
      fixture.detectChanges();

      expect(component.totalSpent()).toBe(3000000);
      expect(component.remainingBalance()).toBe(27000000);
      expect(component.overallProgress()).toBe(10);

      const cards = fixture.nativeElement.querySelectorAll('.summary-card');
      expect(cards[0].textContent).toContain('27,000,000');
      expect(cards[2].textContent).toContain('3,000,000');
      expect(cards[2].textContent).toContain('10% of income');
    });
  });

  describe('7 Jars Performance & Over-budget Indicator', () => {
    it('should render all 7 jars with calculated progress percentages', () => {
      expect(component.jarPerformance().length).toBe(7);
      const rows = fixture.nativeElement.querySelectorAll('.refreshed-jar-row');
      expect(rows.length).toBe(7);
    });

    it('should highlight over-budget jar with warning tag when spent exceeds allocated budget', () => {
      const planOverBudget: MonthlyPlan = {
        ...mockPlan,
        jars: mockPlan.jars.map((j) =>
          j.key === 'travel'
            ? { ...j, spentAmount: 2000000, remainingAmount: -500000 }
            : j
        ),
      };

      component.activePlan.set(planOverBudget);
      fixture.detectChanges();

      const travelJar = component.jarPerformance().find((j) => j.key === 'travel')!;
      expect(travelJar.isOverBudget).toBe(true);
      expect(travelJar.percentageUsed).toBe(133);

      const overBudgetRow = fixture.nativeElement.querySelector('.refreshed-jar-row.over-budget');
      expect(overBudgetRow).toBeTruthy();
      expect(overBudgetRow.textContent).toContain('Entertainment & Travel');
      expect(overBudgetRow.textContent).toContain('Over budget');
    });
  });

  describe('Recent Expenses List', () => {
    it('should display empty recent activity state when no expenses recorded', () => {
      const emptyActivity = fixture.nativeElement.querySelector('.empty-activity');
      expect(emptyActivity).toBeTruthy();
      expect(emptyActivity.textContent).toContain('No expenses recorded for this month yet.');
    });
  });
});
