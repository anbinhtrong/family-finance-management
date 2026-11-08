import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MonthlyPlanService } from '../../features/monthly-planning/services/monthly-plan.service';

@Component({
  selector: 'app-monthly-planning-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './monthly-planning-page.html',
  styleUrl: './monthly-planning-page.scss',
})
export class MonthlyPlanningPage {
  private readonly planService = inject(MonthlyPlanService);
  private readonly router = inject(Router);

  // Form Signals
  period = signal<string>(''); // YYYY-MM from <input type="month">
  monthlyIncome = signal<number | null>(null);

  // Interaction State Signals
  periodTouched = signal<boolean>(false);
  incomeTouched = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // 7 Fixed predefined jars from service
  readonly defaultJars = this.planService.getDefaultJars();

  // Validations
  isPeriodValid = computed(() => {
    const val = this.period().trim();
    if (!val) return false;
    const parts = val.split('-');
    return parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]));
  });

  isIncomeValid = computed(() => {
    const val = this.monthlyIncome();
    return val !== null && !isNaN(val) && val > 0 && Number.isInteger(val);
  });

  isValid = computed(() => this.isPeriodValid() && this.isIncomeValid());

  // Input event handlers
  onPeriodChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.period.set(val);
  }

  onPeriodBlur(): void {
    this.periodTouched.set(true);
  }

  onIncomeChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const cleaned = raw.replace(/,/g, '').trim();
    if (!cleaned) {
      this.monthlyIncome.set(null);
      return;
    }
    const num = Number(cleaned);
    this.monthlyIncome.set(isNaN(num) ? null : num);
  }

  onIncomeBlur(): void {
    this.incomeTouched.set(true);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.periodTouched.set(true);
    this.incomeTouched.set(true);

    if (!this.isValid() || this.isSubmitting()) {
      return;
    }

    const [yearStr, monthStr] = this.period().split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const income = this.monthlyIncome()!;

    this.isSubmitting.set(true);

    this.planService.createPlan(year, month, income);
    this.router.navigate(['/dashboard']);
  }
}
