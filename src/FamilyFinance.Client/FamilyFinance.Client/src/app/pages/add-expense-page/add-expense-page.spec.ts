import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AddExpensePage } from './add-expense-page';
import { ExpenseService } from '../../features/expenses/services/expense.service';
import { MonthlyPlanService } from '../../features/monthly-planning/services/monthly-plan.service';
import { MonthlyPlan } from '../../features/monthly-planning/models/monthly-plan.model';

describe('AddExpensePage', () => {
  let fixture: ComponentFixture<AddExpensePage>;
  let component: AddExpensePage;
  let expenseService: ExpenseService;
  let planService: MonthlyPlanService;
  let router: Router;

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
    const planServiceMock = {
      getPlan: vi.fn((year: number, month: number) => (year === 2026 && month === 10 ? mockPlan : undefined)),
      getPlanByMonth: vi.fn((year: number, month: number) =>
        year === 2026 && month === 10 ? of(mockPlan) : throwError(() => new Error('Not found'))
      ),
    };

    const expenseServiceMock = {
      recordExpense: vi.fn().mockReturnValue(
        of({
          id: '1',
          planId: '1',
          jarKey: 'food',
          amount: 150000,
          date: '2026-10-15',
          note: 'Supermarket groceries',
          createdAt: new Date().toISOString(),
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [AddExpensePage],
      providers: [
        { provide: MonthlyPlanService, useValue: planServiceMock },
        { provide: ExpenseService, useValue: expenseServiceMock },
        provideRouter([]),
      ],
    }).compileComponents();

    planService = TestBed.inject(MonthlyPlanService);
    expenseService = TestBed.inject(ExpenseService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(AddExpensePage);
    component = fixture.componentInstance;
    component.expenseDate.set('2026-10-15');
    component.selectedPlan.set(mockPlan);
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State & Selection', () => {
    it('should list all 7 predefined jars from the active plan in the jar dropdown', () => {
      expect(component.availableJars().length).toBe(7);
      const options = fixture.nativeElement.querySelectorAll('#jar-type option');
      expect(options.length).toBe(8);
    });

    it('should display the empty placeholder jar summary card before a jar is selected', () => {
      expect(component.selectedJar()).toBeNull();
      const emptySummary = fixture.nativeElement.querySelector('.jar-summary.empty');
      expect(emptySummary).toBeTruthy();
      expect(emptySummary.textContent).toContain('Select a jar');
    });

    it('should update right-hand summary panel when a jar is selected', () => {
      component.jarKey.set('food');
      fixture.detectChanges();

      expect(component.selectedJar()?.key).toBe('food');
      const activeSummary = fixture.nativeElement.querySelector('.jar-summary.jar-active');
      expect(activeSummary).toBeTruthy();
      expect(activeSummary.textContent).toContain('Food');
      expect(activeSummary.textContent).toContain('20% of total income');
      expect(activeSummary.textContent).toContain('6,000,000 VND');
    });
  });

  describe('Validation', () => {
    it('should be invalid when required fields are missing', () => {
      component.jarKey.set('');
      component.amount.set(null);
      component.description.set('');
      fixture.detectChanges();

      expect(component.isValid()).toBe(false);
      const saveBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.save-button');
      expect(saveBtn.disabled).toBe(true);
    });

    it('should show error when selecting a date outside any created plan month', () => {
      component.expenseDate.set('2029-01-10');
      component.selectedPlan.set(null);
      fixture.detectChanges();

      expect(component.isPlanAvailable()).toBe(false);
      expect(component.isValid()).toBe(false);

      const errorAlert = fixture.nativeElement.querySelector('.error-status');
      expect(errorAlert).toBeTruthy();
      expect(errorAlert.textContent).toContain('No monthly plan exists for the selected date');
    });

    it('should become valid when all required fields and valid date within plan are provided', () => {
      component.expenseDate.set('2026-10-15');
      component.selectedPlan.set(mockPlan);
      component.jarKey.set('food');
      component.amount.set(150000);
      component.description.set('Supermarket groceries');
      fixture.detectChanges();

      expect(component.isValid()).toBe(true);
      const saveBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.save-button');
      expect(saveBtn.disabled).toBe(false);
    });
  });

  describe('Submission Flow', () => {
    it('should call expenseService.recordExpense and navigate to /dashboard on successful submit', () => {
      component.expenseDate.set('2026-10-20');
      component.selectedPlan.set(mockPlan);
      component.jarKey.set('living');
      component.amount.set(500000);
      component.description.set('Electricity bill');
      fixture.detectChanges();

      const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));

      expect(expenseService.recordExpense).toHaveBeenCalledWith('1', {
        date: '2026-10-20',
        jarKey: 'living',
        amount: 500000,
        note: 'Electricity bill',
      });
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
