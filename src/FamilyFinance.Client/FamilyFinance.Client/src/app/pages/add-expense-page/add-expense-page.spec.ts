import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AddExpensePage } from './add-expense-page';
import { ExpenseService } from '../../features/expenses/services/expense.service';
import { MonthlyPlanService } from '../../features/monthly-planning/services/monthly-plan.service';

describe('AddExpensePage', () => {
  let fixture: ComponentFixture<AddExpensePage>;
  let component: AddExpensePage;
  let expenseService: ExpenseService;
  let planService: MonthlyPlanService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddExpensePage],
      providers: [ExpenseService, MonthlyPlanService, provideRouter([])],
    }).compileComponents();

    planService = TestBed.inject(MonthlyPlanService);
    expenseService = TestBed.inject(ExpenseService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // Seed test plan for 2026-10 with 30,000,000 VND
    planService.createPlan(2026, 10, 30000000);

    fixture = TestBed.createComponent(AddExpensePage);
    component = fixture.componentInstance;
    component.expenseDate.set('2026-10-15');
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State & Selection', () => {
    it('should list all 7 predefined jars from the active plan in the jar dropdown', () => {
      expect(component.availableJars().length).toBe(7);
      const options = fixture.nativeElement.querySelectorAll('#jar-type option');
      // 1 placeholder + 7 jars = 8 options
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
      // Food allocated: 20% of 30M = 6,000,000 VND
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
      // 2029-01 has no plan
      component.expenseDate.set('2029-01-10');
      fixture.detectChanges();

      expect(component.isPlanAvailable()).toBe(false);
      expect(component.isValid()).toBe(false);

      const errorAlert = fixture.nativeElement.querySelector('.error-status');
      expect(errorAlert).toBeTruthy();
      expect(errorAlert.textContent).toContain('No monthly plan exists for the selected date');
    });

    it('should become valid when all required fields and valid date within plan are provided', () => {
      component.expenseDate.set('2026-10-15');
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
      const recordExpenseSpy = vi.spyOn(expenseService, 'recordExpense');

      component.expenseDate.set('2026-10-20');
      component.jarKey.set('living');
      component.amount.set(500000);
      component.description.set('Electricity bill');
      fixture.detectChanges();

      const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));

      expect(recordExpenseSpy).toHaveBeenCalledWith({
        date: '2026-10-20',
        jarKey: 'living',
        amount: 500000,
        note: 'Electricity bill',
      });
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
