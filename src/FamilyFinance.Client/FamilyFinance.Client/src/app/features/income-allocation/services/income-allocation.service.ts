import { Injectable, inject, signal } from '@angular/core';
import {
  IncomeAllocationSession,
  JarAllocationItem,
} from '../models/income-allocation.model';
import { MonthlyPlanService } from '../../monthly-planning/services/monthly-plan.service';

export const STANDARD_JAR_CONFIG: Omit<JarAllocationItem, 'allocatedAmount'>[] = [
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
export class IncomeAllocationService {
  private readonly monthlyPlanService = inject(MonthlyPlanService);

  private readonly sessionSignal = signal<IncomeAllocationSession>(this.createInitialSession());
  readonly session = this.sessionSignal.asReadonly();

  /**
   * Calculates initial jar allocations based on total income and standard jar percentages (summing 100%).
   */
  calculateInitialAllocations(total: number): JarAllocationItem[] {
    const validTotal = Math.max(0, Number(total) || 0);
    return STANDARD_JAR_CONFIG.map((jar) => ({
      ...jar,
      allocatedAmount: Math.round((validTotal * jar.defaultRate) / 100),
    }));
  }

  /**
   * Saves and stores the income allocation session in memory.
   */
  saveAllocation(session: IncomeAllocationSession): void {
    this.sessionSignal.set(session);
  }

  private createInitialSession(): IncomeAllocationSession {
    const activePlan = this.monthlyPlanService.currentPlan();
    const defaultIncome = activePlan?.totalIncome ?? 35000000;
    const defaultMonth = activePlan?.month ?? 11;
    const defaultYear = activePlan?.year ?? 2026;

    return {
      month: defaultMonth,
      year: defaultYear,
      totalIncome: defaultIncome,
      isConfirmed: false,
      jars: this.calculateInitialAllocations(defaultIncome),
    };
  }
}
