import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MonthlyPlanService } from '../../features/monthly-planning/services/monthly-plan.service';
import { ExpenseService } from '../../features/expenses/services/expense.service';
import { AllocatedJarItem, MonthlyPlan, PredefinedJarKey } from '../../features/monthly-planning/models/monthly-plan.model';

export interface JarPerformanceItem extends AllocatedJarItem {
  percentageUsed: number;
  isOverBudget: boolean;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  private readonly planService = inject(MonthlyPlanService);
  private readonly expenseService = inject(ExpenseService);
  private readonly now = new Date();

  // Month selector signals (defaulting to current active plan month & year, e.g. 10/2026)
  selectedYear = signal<number>(this.now.getFullYear());
  selectedMonth = signal<number>(this.now.getMonth() + 1);

  // Dynamic plan and status
  activePlan = signal<MonthlyPlan | null>(null);
  isLoading = signal<boolean>(false);

  constructor() {
    // Reactively load plan & spending metrics whenever year or month changes
    effect(() => {
      const year = this.selectedYear();
      const month = this.selectedMonth();
      this.loadDashboardData(year, month);
    });
  }

  loadDashboardData(year: number, month: number): void {
    this.isLoading.set(true);

    this.planService.getPlanByMonth(year, month).subscribe({
      next: (plan) => {
        this.activePlan.set(plan);
        this.isLoading.set(false);

        // Fetch jar spending performance
        this.expenseService.getSpendingByJars(plan.id).subscribe({
          next: () => {
            // Updated in service plansSignal
            const refreshed = this.planService.getPlan(year, month);
            if (refreshed) {
              this.activePlan.set(refreshed);
            }
          },
          error: () => {
            // Keep plan allocations even if spending endpoint errors
          },
        });
      },
      error: () => {
        this.activePlan.set(null);
        this.isLoading.set(false);
      },
    });
  }

  // Today label
  todayLabel = computed(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date().toLocaleDateString('en-US', options);
  });

  // Expenses for the selected plan
  planExpenses = computed(() => {
    const plan = this.activePlan();
    if (!plan) return [];
    return this.expenseService.expenses().filter((exp) => exp.planId === plan.id);
  });

  // Overview metrics
  totalIncome = computed(() => this.activePlan()?.income ?? 0);

  totalSpent = computed(() => {
    const plan = this.activePlan();
    if (!plan) return 0;
    return plan.jars.reduce((sum, jar) => sum + jar.spentAmount, 0);
  });

  remainingBalance = computed(() => this.totalIncome() - this.totalSpent());

  overallProgress = computed(() => {
    const income = this.totalIncome();
    if (income <= 0) return 0;
    return Number(((this.totalSpent() / income) * 100).toFixed(1));
  });

  // 7 Jars performance
  jarPerformance = computed<JarPerformanceItem[]>(() => {
    const plan = this.activePlan();
    if (!plan) return [];

    return plan.jars.map((jar) => {
      const percentageUsed =
        jar.allocatedAmount > 0
          ? Math.round((jar.spentAmount / jar.allocatedAmount) * 100)
          : 0;
      return {
        ...jar,
        percentageUsed,
        isOverBudget: jar.spentAmount > jar.allocatedAmount,
      };
    });
  });

  // Recent activity: expenses sorted descending by date
  recentExpenses = computed(() => {
    const exps = [...this.planExpenses()];
    return exps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  });

  // Month display label (e.g., "October 2026")
  periodLabel = computed(() => {
    const date = new Date(this.selectedYear(), this.selectedMonth() - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  onMonthChange(event: Event): void {
    const val = Number((event.target as HTMLSelectElement).value);
    this.selectedMonth.set(val);
  }

  getJarInitial(key: PredefinedJarKey): string {
    switch (key) {
      case 'living': return 'L';
      case 'food': return 'F';
      case 'children': return 'C';
      case 'emergency': return 'E';
      case 'savings': return 'S';
      case 'investment': return 'I';
      case 'travel': return 'T';
    }
  }

  getJarLabel(key: PredefinedJarKey): string {
    const jar = this.jarPerformance().find((j) => j.key === key);
    return jar ? jar.name : 'Jar';
  }
}
