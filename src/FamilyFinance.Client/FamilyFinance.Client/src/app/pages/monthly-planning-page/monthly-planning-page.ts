import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MonthlyPlanService } from '../../features/monthly-planning/services/monthly-plan.service';
import { PlanCategoryItem } from '../../features/monthly-planning/models/monthly-plan.model';

@Component({
  selector: 'app-monthly-planning-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './monthly-planning-page.html',
  styleUrl: './monthly-planning-page.scss',
})
export class MonthlyPlanningPage {
  private planService = inject(MonthlyPlanService);

  // Read data from service into component signal
  plan = signal(this.planService.currentPlan());

  // Filter items by type
  incomeItems = computed(() =>
    this.plan()?.items.filter((i) => i.type === 'Income') ?? []
  );

  expenseItems = computed(() =>
    this.plan()?.items.filter((i) => i.type === 'Expense') ?? []
  );

  // Automatically compute totals
  totalIncome = computed(() =>
    this.incomeItems().reduce((acc, cur) => acc + (Number(cur.plannedAmount) || 0), 0)
  );

  totalExpense = computed(() =>
    this.expenseItems().reduce((acc, cur) => acc + (Number(cur.plannedAmount) || 0), 0)
  );

  netSavings = computed(() => this.totalIncome() - this.totalExpense());

  // Reactive actions
  updateAmount(item: PlanCategoryItem, event: Event): void {
    const val = Number((event.target as HTMLInputElement).value) || 0;
    item.plannedAmount = val;
    this.plan.update((prev) => (prev ? { ...prev } : null));
  }

  onSave(): void {
    const current = this.plan();
    if (!current) return;

    this.planService.savePlan({
      ...current,
      totalIncome: this.totalIncome(),
      totalExpense: this.totalExpense(),
      netSavings: this.netSavings(),
      status: 'Confirmed',
    });
    alert('Monthly plan saved successfully!');
  }

  createPlanNow(): void {
    this.planService.createDefaultPlan();
    this.plan.set(this.planService.currentPlan());
  }

  switchToEmptyState(): void {
    this.planService.setUnavailable();
    this.plan.set(null);
  }
}
