import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ExpenseService } from '../../features/expenses/services/expense.service';
import { MonthlyPlanService } from '../../features/monthly-planning/services/monthly-plan.service';
import { MonthlyPlan, PredefinedJarKey } from '../../features/monthly-planning/models/monthly-plan.model';

@Component({
  selector: 'app-add-expense-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-expense-page.html',
  styleUrl: './add-expense-page.scss',
})
export class AddExpensePage {
  private readonly expenseService = inject(ExpenseService);
  private readonly planService = inject(MonthlyPlanService);
  private readonly router = inject(Router);

  // Default date to today formatted as YYYY-MM-DD
  private readonly todayIso = new Date().toISOString().substring(0, 10);

  // Form Signals
  expenseDate = signal<string>(this.todayIso);
  jarKey = signal<PredefinedJarKey | ''>('');
  amount = signal<number | null>(null);
  description = signal<string>('');

  // Active plan state for the selected date
  selectedPlan = signal<MonthlyPlan | null>(null);
  isLoadingPlan = signal<boolean>(false);

  // Touched state signals for validation feedback
  dateTouched = signal<boolean>(false);
  jarTouched = signal<boolean>(false);
  amountTouched = signal<boolean>(false);
  descriptionTouched = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  statusMessage = signal<string>('Please complete the required expense details.');
  errorMessage = signal<string | null>(null);

  constructor() {
    // When expenseDate changes, load the corresponding monthly plan
    effect(() => {
      const d = this.expenseDate();
      if (!d) {
        this.selectedPlan.set(null);
        return;
      }

      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) {
        this.selectedPlan.set(null);
        return;
      }

      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;

      // Check if plan is cached in service first
      const cached = this.planService.getPlan(year, month);
      if (cached) {
        this.selectedPlan.set(cached);
        return;
      }

      this.isLoadingPlan.set(true);
      this.planService.getPlanByMonth(year, month).subscribe({
        next: (plan) => {
          this.selectedPlan.set(plan);
          this.isLoadingPlan.set(false);
        },
        error: () => {
          this.selectedPlan.set(null);
          this.isLoadingPlan.set(false);
        },
      });
    });
  }

  // Available jars list from the active plan
  availableJars = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return [];
    return plan.jars;
  });

  // Selected jar object
  selectedJar = computed(() => {
    const key = this.jarKey();
    if (!key) return null;
    return this.availableJars().find((j) => j.key === key) ?? null;
  });

  // Validations
  isDateValid = computed(() => {
    const d = this.expenseDate();
    if (!d) return false;
    const dateObj = new Date(d);
    return !isNaN(dateObj.getTime());
  });

  isJarValid = computed(() => this.jarKey() !== '');

  isAmountValid = computed(() => {
    const val = this.amount();
    return val !== null && !isNaN(val) && val > 0 && Number.isInteger(val);
  });

  isDescriptionValid = computed(() => this.description().trim().length > 0);

  isPlanAvailable = computed(() => this.selectedPlan() !== null);

  isValid = computed(() =>
    this.isDateValid() &&
    this.isJarValid() &&
    this.isAmountValid() &&
    this.isDescriptionValid() &&
    this.isPlanAvailable()
  );

  // Handlers
  onDateChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.expenseDate.set(val);
    this.errorMessage.set(null);
  }

  onJarChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as PredefinedJarKey | '';
    this.jarKey.set(val);
    this.errorMessage.set(null);
  }

  onAmountChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const cleaned = raw.replace(/,/g, '').trim();
    if (!cleaned) {
      this.amount.set(null);
      this.errorMessage.set(null);
      return;
    }
    const num = Number(cleaned);
    this.amount.set(isNaN(num) ? null : num);
    this.errorMessage.set(null);
  }

  onDescriptionChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.description.set(val);
    this.errorMessage.set(null);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.dateTouched.set(true);
    this.jarTouched.set(true);
    this.amountTouched.set(true);
    this.descriptionTouched.set(true);
    this.errorMessage.set(null);

    const plan = this.selectedPlan();
    if (!this.isValid() || this.isSubmitting() || !plan) {
      return;
    }

    this.isSubmitting.set(true);

    this.expenseService
      .recordExpense(plan.id, {
        date: this.expenseDate(),
        jarKey: this.jarKey() as PredefinedJarKey,
        amount: this.amount()!,
        note: this.description().trim(),
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          if (err.error?.message) {
            this.errorMessage.set(err.error.message);
          } else {
            this.errorMessage.set('Failed to record expense. Please try again.');
          }
        },
      });
  }
}
