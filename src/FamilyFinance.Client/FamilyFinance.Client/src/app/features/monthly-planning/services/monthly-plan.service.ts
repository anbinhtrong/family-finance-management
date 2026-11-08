import { Injectable, signal } from '@angular/core';
import { MonthlyPlan } from '../models/monthly-plan.model';

@Injectable({
  providedIn: 'root',
})
export class MonthlyPlanService {
  // Initial mock data
  private currentPlanSignal = signal<MonthlyPlan | null>({
    month: 11,
    year: 2026,
    status: 'Draft',
    totalIncome: 35000000,
    totalExpense: 22000000,
    netSavings: 13000000,
    items: [
      { id: '1', name: 'Primary Salary', type: 'Income', plannedAmount: 30000000, note: 'Net salary' },
      { id: '2', name: 'Bonus & Side Income', type: 'Income', plannedAmount: 5000000, note: 'Freelance & quarterly bonus' },
      { id: '3', name: 'Housing & Utilities', type: 'Expense', plannedAmount: 8000000, note: 'Electricity, water, internet' },
      { id: '4', name: 'Food & Groceries', type: 'Expense', plannedAmount: 7000000, note: 'Supermarket and daily dining' },
      { id: '5', name: 'Children & Education', type: 'Expense', plannedAmount: 4000000, note: 'Tuition and school supplies' },
      { id: '6', name: 'Personal Expenses', type: 'Expense', plannedAmount: 3000000, note: 'Shopping and personal care' },
    ],
  });

  readonly currentPlan = this.currentPlanSignal.asReadonly();

  savePlan(plan: MonthlyPlan): void {
    this.currentPlanSignal.set(plan);
    console.log('Monthly plan saved:', plan);
  }

  createDefaultPlan(year = 2026, month = 11, income = 35000000): void {
    this.currentPlanSignal.set({
      year,
      month,
      status: 'Draft',
      totalIncome: income,
      totalExpense: 0,
      netSavings: income,
      items: [
        { id: '1', name: 'Primary Salary', type: 'Income', plannedAmount: income, note: 'Net salary' },
      ],
    });
  }

  setUnavailable(): void {
    this.currentPlanSignal.set(null);
  }
}
