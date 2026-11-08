import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ExpenseService } from '../../features/expenses/services/expense.service';
import { MonthlyPlanService } from '../../features/monthly-planning/services/monthly-plan.service';
import { PredefinedJarKey } from '../../features/monthly-planning/models/monthly-plan.model';

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

  // Touched state signals for validation feedback
  dateTouched = signal<boolean>(false);
  jarTouched = signal<boolean>(false);
  amountTouched = signal<boolean>(false);
  descriptionTouched = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  statusMessage = signal<string>('Please complete the required expense details.');
  errorMessage = signal<string | null>(null);

  // Active plan resolved from the selected date
  selectedPlan = computed(() => {
    const d = this.expenseDate();
    if (!d) return null;
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return null;
    return this.planService.getPlan(dateObj.getFullYear(), dateObj.getMonth() + 1) ?? null;
  });

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

    if (!this.isValid() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    const result = this.expenseService.recordExpense({
      date: this.expenseDate(),
      jarKey: this.jarKey() as PredefinedJarKey,
      amount: this.amount()!,
      note: this.description(),
    });

    if (result.success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage.set(result.error ?? 'Failed to record expense.');
      this.isSubmitting.set(false);
    }
  }
}

