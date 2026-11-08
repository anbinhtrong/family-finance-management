import { Injectable, signal } from '@angular/core';
import {
  AllocatedJarItem,
  MonthlyPlan,
  PredefinedJar,
} from '../models/monthly-plan.model';
import { Expense } from '../../expenses/models/expense.model';

export const DEFAULT_PREDEFINED_JARS: PredefinedJar[] = [
  { id: '1', name: 'Living Expenses', key: 'living', defaultRate: 35 },
  { id: '2', name: 'Food', key: 'food', defaultRate: 20 },
  { id: '3', name: 'Children', key: 'children', defaultRate: 10 },
  { id: '4', name: 'Emergency Fund', key: 'emergency', defaultRate: 10 },
  { id: '5', name: 'Savings', key: 'savings', defaultRate: 10 },
  { id: '6', name: 'Investment', key: 'investment', defaultRate: 10 },
  { id: '7', name: 'Entertainment & Travel', key: 'travel', defaultRate: 5 },
];

@Injectable({
  providedIn: 'root',
})
export class MonthlyPlanService {
  // Pre-seed an initial active plan for 2026-10 so users can immediately test Add Expense
  private readonly initialPlan: MonthlyPlan = {
    id: '2026-10',
    year: 2026,
    month: 10,
    income: 30000000,
    createdAt: new Date().toISOString(),
    jars: this.calculateAllocations(30000000),
  };

  private readonly plansSignal = signal<MonthlyPlan[]>([this.initialPlan]);
  readonly plans = this.plansSignal.asReadonly();

  // Active monthly plan
  private readonly currentPlanSignal = signal<MonthlyPlan | null>(this.initialPlan);
  readonly currentPlan = this.currentPlanSignal.asReadonly();

  /**
   * Returns the 7 fixed predefined jars with their standard rates.
   */
  getDefaultJars(): PredefinedJar[] {
    return DEFAULT_PREDEFINED_JARS;
  }

  /**
   * Calculates allocated whole-VND amounts and initializes spent/remaining for the 7 jars.
   */
  calculateAllocations(income: number): AllocatedJarItem[] {
    const validIncome = Math.max(0, Math.floor(income));
    return DEFAULT_PREDEFINED_JARS.map((jar) => {
      const allocated = Math.round((validIncome * jar.defaultRate) / 100);
      return {
        ...jar,
        allocatedAmount: allocated,
        spentAmount: 0,
        remainingAmount: allocated,
      };
    });
  }

  /**
   * Checks whether a plan already exists for the given year and month.
   */
  hasPlan(year: number, month: number): boolean {
    return this.plansSignal().some((p) => p.year === year && p.month === month);
  }

  /**
   * Finds a plan by year and month.
   */
  getPlan(year: number, month: number): MonthlyPlan | undefined {
    return this.plansSignal().find((p) => p.year === year && p.month === month);
  }

  /**
   * Sets the active plan.
   */
  setCurrentPlan(plan: MonthlyPlan | null): void {
    this.currentPlanSignal.set(plan);
  }

  /**
   * Creates and stores a new monthly plan.
   */
  createPlan(year: number, month: number, income: number): MonthlyPlan {
    const planId = `${year}-${String(month).padStart(2, '0')}`;
    const newPlan: MonthlyPlan = {
      id: planId,
      year,
      month,
      income,
      createdAt: new Date().toISOString(),
      jars: this.calculateAllocations(income),
    };

    this.plansSignal.update((list) => {
      const filtered = list.filter((p) => p.id !== planId);
      return [...filtered, newPlan];
    });

    this.currentPlanSignal.set(newPlan);
    return newPlan;
  }

  /**
   * Applies an expense to the matching monthly plan and updates jar spent/remaining amounts.
   */
  applyExpense(expense: Expense): void {
    this.plansSignal.update((plans) =>
      plans.map((p) => {
        if (p.id !== expense.planId) return p;

        const updatedJars = p.jars.map((jar) => {
          if (jar.key !== expense.jarKey) return jar;
          const newSpent = jar.spentAmount + expense.amount;
          return {
            ...jar,
            spentAmount: newSpent,
            remainingAmount: jar.allocatedAmount - newSpent,
          };
        });

        return { ...p, jars: updatedJars };
      })
    );

    // Sync current plan if active
    const cur = this.currentPlanSignal();
    if (cur && cur.id === expense.planId) {
      const refreshed = this.plansSignal().find((p) => p.id === cur.id);
      if (refreshed) this.currentPlanSignal.set(refreshed);
    }
  }
}
