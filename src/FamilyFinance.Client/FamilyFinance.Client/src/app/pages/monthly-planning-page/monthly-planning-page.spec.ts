import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { MonthlyPlanningPage } from './monthly-planning-page';
import { MonthlyPlanService } from '../../features/monthly-planning/services/monthly-plan.service';
import { MonthlyPlan } from '../../features/monthly-planning/models/monthly-plan.model';

describe('MonthlyPlanningPage', () => {
  let fixture: ComponentFixture<MonthlyPlanningPage>;
  let component: MonthlyPlanningPage;
  let planService: MonthlyPlanService;
  let router: Router;

  const mockPlan: MonthlyPlan = {
    id: '1',
    year: 2026,
    month: 11,
    income: 45000000,
    createdAt: new Date().toISOString(),
    jars: [],
  };

  beforeEach(async () => {
    const planServiceMock = {
      getDefaultJars: vi.fn().mockReturnValue([
        { id: '1', name: 'Living Expenses', key: 'living', defaultRate: 35 },
        { id: '2', name: 'Food', key: 'food', defaultRate: 20 },
      ]),
      createPlan: vi.fn().mockReturnValue(of(mockPlan)),
    };

    await TestBed.configureTestingModule({
      imports: [MonthlyPlanningPage],
      providers: [
        { provide: MonthlyPlanService, useValue: planServiceMock },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthlyPlanningPage);
    component = fixture.componentInstance;
    planService = TestBed.inject(MonthlyPlanService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should have submit button disabled on initial load with empty inputs', () => {
      const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.primary-button');
      expect(submitBtn.disabled).toBe(true);
      expect(component.isValid()).toBe(false);
    });

    it('should have submit button disabled when income is 0 or negative', () => {
      component.period.set('2026-11');
      component.monthlyIncome.set(0);
      fixture.detectChanges();
      expect(component.isValid()).toBe(false);

      component.monthlyIncome.set(-1000);
      fixture.detectChanges();
      expect(component.isValid()).toBe(false);
    });

    it('should show validation error message when income is touched and invalid', () => {
      component.incomeTouched.set(true);
      component.monthlyIncome.set(null);
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector('#income-error');
      expect(errorEl).toBeTruthy();
      expect(errorEl.textContent).toContain('Income must be a positive whole-VND amount.');
    });

    it('should show validation error message when period is touched and missing', () => {
      component.periodTouched.set(true);
      component.period.set('');
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector('#period-error');
      expect(errorEl).toBeTruthy();
      expect(errorEl.textContent).toContain('Select a month for this plan.');
    });

    it('should enable submit button when valid month and positive whole-VND income are provided', () => {
      component.period.set('2026-11');
      component.monthlyIncome.set(30000000);
      fixture.detectChanges();

      expect(component.isValid()).toBe(true);
      const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.primary-button');
      expect(submitBtn.disabled).toBe(false);
    });
  });

  describe('Submission Flow', () => {
    it('should call planService.createPlan with correct parameters and navigate to /dashboard on submit', () => {
      component.period.set('2026-11');
      component.monthlyIncome.set(45000000);
      fixture.detectChanges();

      const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));

      expect(planService.createPlan).toHaveBeenCalledWith(2026, 11, 45000000);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should display error message if plan creation fails', () => {
      vi.spyOn(planService, 'createPlan').mockReturnValue(
        throwError(() => ({ status: 409, error: { message: 'A monthly plan already exists for this month.' } }))
      );

      component.period.set('2026-11');
      component.monthlyIncome.set(45000000);
      fixture.detectChanges();

      const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(component.errorMessage()).toBe('A monthly plan already exists for this month.');
      const serverErrorEl = fixture.nativeElement.querySelector('.server-error');
      expect(serverErrorEl).toBeTruthy();
      expect(serverErrorEl.textContent).toContain('A monthly plan already exists for this month.');
    });
  });
});
