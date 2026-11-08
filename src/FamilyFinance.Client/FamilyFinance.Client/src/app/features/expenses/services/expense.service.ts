import { Injectable, inject, signal } from '@angular/core';
import { CreateExpenseDto, Expense } from '../models/expense.model';
import { MonthlyPlanService } from '../../monthly-planning/services/monthly-plan.service';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private readonly planService = inject(MonthlyPlanService);

  private readonly expensesSignal = signal<Expense[]>([]);
  readonly expenses = this.expensesSignal.asReadonly();

  /**
   * Records an expense, validates the plan, updates the target jar's spent amount and remaining balance.
   */
  recordExpense(dto: CreateExpenseDto): { success: boolean; error?: string; expense?: Expense } {
    // 1. Determine plan from date
    const dateObj = new Date(dto.date);
    if (isNaN(dateObj.getTime())) {
      return { success: false, error: 'Invalid expense date.' };
    }

    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const plan = this.planService.getPlan(year, month);

    if (!plan) {
      return {
        success: false,
        error: `No monthly plan exists for ${year}-${String(month).padStart(2, '0')}. Please create a plan first.`,
      };
    }

    // 2. Validate jar membership
    const targetJar = plan.jars.find((j) => j.key === dto.jarKey);
    if (!targetJar) {
      return { success: false, error: 'The selected jar does not belong to this monthly plan.' };
    }

    // 3. Validate positive whole amount
    if (!dto.amount || dto.amount <= 0 || !Number.isInteger(dto.amount)) {
      return { success: false, error: 'Amount must be a positive whole-VND value.' };
    }

    // 4. Validate non-empty note/description
    if (!dto.note || !dto.note.trim()) {
      return { success: false, error: 'Description is required.' };
    }

    // 5. Create and persist expense
    const newExpense: Expense = {
      id: 'exp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      planId: plan.id,
      jarKey: dto.jarKey,
      amount: dto.amount,
      date: dto.date,
      note: dto.note.trim(),
      createdAt: new Date().toISOString(),
    };

    this.expensesSignal.update((list) => [newExpense, ...list]);

    // 6. Update plan & jar balances
    this.planService.applyExpense(newExpense);

    return { success: true, expense: newExpense };
  }
}

