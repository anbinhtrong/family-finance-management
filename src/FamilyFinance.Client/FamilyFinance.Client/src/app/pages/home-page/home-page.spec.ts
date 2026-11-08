import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePage } from './home-page';
import { MonthlyPlanService } from '../../features/monthly-planning/services/monthly-plan.service';
import { ExpenseService } from '../../features/expenses/services/expense.service';

describe('HomePage (Monthly Dashboard)', () => {
  let fixture: ComponentFixture<HomePage>;
  let component: HomePage;
  let planService: MonthlyPlanService;
  let expenseService: ExpenseService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [MonthlyPlanService, ExpenseService, provideRouter([])],
    }).compileComponents();

    planService = TestBed.inject(MonthlyPlanService);
    expenseService = TestBed.inject(ExpenseService);

    // Setup an active plan for October 2026 with 30,000,000 VND income
    planService.createPlan(2026, 10, 30000000);

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    component.selectedYear.set(2026);
    component.selectedMonth.set(10);
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  describe('Empty State', () => {
    it('should display "No monthly plan" empty state when no plan exists for the selected period', () => {
      // Switch to January 2026 where no plan exists
      component.selectedMonth.set(1);
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
      // Available balance card
      expect(cards[0].textContent).toContain('30,000,000');
      // Monthly income card
      expect(cards[1].textContent).toContain('30,000,000');
      // Spent this month card
      expect(cards[2].textContent).toContain('0');
      expect(cards[2].textContent).toContain('0% of income');
    });

    it('should dynamically update KPI cards and overall progress when expenses are recorded', () => {
      expenseService.recordExpense({
        date: '2026-10-05',
        jarKey: 'food',
        amount: 3000000, // 10% of 30M
        note: 'Groceries store',
      });
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
      // Entertainment & Travel budget: 5% of 30M = 1,500,000 VND
      expenseService.recordExpense({
        date: '2026-10-18',
        jarKey: 'travel',
        amount: 2000000, // 500k over budget
        note: 'Concert ticket and travel',
      });
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
    it('should list recent expenses sorted descending by date', () => {
      expenseService.recordExpense({
        date: '2026-10-02',
        jarKey: 'food',
        amount: 100000,
        note: 'First dinner',
      });
      expenseService.recordExpense({
        date: '2026-10-15',
        jarKey: 'living',
        amount: 800000,
        note: 'Water bill',
      });
      expenseService.recordExpense({
        date: '2026-10-10',
        jarKey: 'savings',
        amount: 500000,
        note: 'Mid-month savings',
      });
      fixture.detectChanges();

      const recent = component.recentExpenses();
      expect(recent.length).toBe(3);
      // Sorted descending: 10-15, then 10-10, then 10-02
      expect(recent[0].date).toBe('2026-10-15');
      expect(recent[0].note).toBe('Water bill');
      expect(recent[1].date).toBe('2026-10-10');
      expect(recent[2].date).toBe('2026-10-02');

      const listItems = fixture.nativeElement.querySelectorAll('.activity-list li');
      expect(listItems.length).toBe(3);
      expect(listItems[0].textContent).toContain('Water bill');
    });
  });
});
