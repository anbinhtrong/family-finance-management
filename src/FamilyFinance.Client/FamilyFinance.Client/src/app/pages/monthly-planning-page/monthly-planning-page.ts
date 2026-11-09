import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MonthlyPlanService } from '../../features/monthly-planning/services/monthly-plan.service';

import { MonthYearPickerComponent } from '../../shared/components/month-year-picker/month-year-picker';

@Component({
  selector: 'app-monthly-planning-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MonthYearPickerComponent],
  templateUrl: './monthly-planning-page.html',
  styleUrl: './monthly-planning-page.scss',
})
export class MonthlyPlanningPage implements OnInit {
  private readonly planService = inject(MonthlyPlanService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Form Signals
  period = signal<string>(''); // YYYY-MM
  selectedYear = signal<number>(new Date().getFullYear());
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  monthlyIncome = signal<number | null>(null);

  // Interaction State Signals
  periodTouched = signal<boolean>(false);
  incomeTouched = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // 7 Fixed predefined jars from service
  readonly defaultJars = this.planService.getDefaultJars();

  ngOnInit(): void {
    // Read optional period query parameter, e.g. /monthly-planning?period=2026-10
    const queryPeriod = this.route.snapshot.queryParamMap.get('period');
    if (queryPeriod) {
      const parts = queryPeriod.split('-');
      if (parts.length === 2) {
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
          this.selectedYear.set(year);
          this.selectedMonth.set(month);
          this.period.set(queryPeriod);
          return;
        }
      }
    }

    // Default to current year and month if not provided
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    this.selectedYear.set(currentYear);
    this.selectedMonth.set(currentMonth);
    this.period.set(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
  }

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
  onPeriodPicked(event: { year: number; month: number }): void {
    this.selectedYear.set(event.year);
    this.selectedMonth.set(event.month);
    const mStr = String(event.month).padStart(2, '0');
    this.period.set(`${event.year}-${mStr}`);
    this.periodTouched.set(true);
    this.errorMessage.set(null);
  }

  onPeriodChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.period.set(val);
    this.errorMessage.set(null);
  }

  onPeriodBlur(): void {
    this.periodTouched.set(true);
  }

  onIncomeChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const cleaned = raw.replace(/,/g, '').trim();
    if (!cleaned) {
      this.monthlyIncome.set(null);
      this.errorMessage.set(null);
      return;
    }
    const num = Number(cleaned);
    this.monthlyIncome.set(isNaN(num) ? null : num);
    this.errorMessage.set(null);
  }

  onIncomeBlur(): void {
    this.incomeTouched.set(true);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.periodTouched.set(true);
    this.incomeTouched.set(true);
    this.errorMessage.set(null);

    if (!this.isValid() || this.isSubmitting()) {
      return;
    }

    const [yearStr, monthStr] = this.period().split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const income = this.monthlyIncome()!;

    this.isSubmitting.set(true);

    this.planService.createPlan(year, month, income).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        if (err.error?.message) {
          this.errorMessage.set(err.error.message);
        } else if (err.status === 409) {
          this.errorMessage.set('A monthly plan already exists for this month.');
        } else {
          this.errorMessage.set('Failed to create monthly plan. Please try again.');
        }
      },
    });
  }
}
