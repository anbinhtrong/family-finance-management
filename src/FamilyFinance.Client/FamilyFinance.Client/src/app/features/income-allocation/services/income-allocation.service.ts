import { Injectable, signal } from '@angular/core';
import { IncomeAllocationPlan, JarAllocationItem } from '../models/income-allocation.model';

@Injectable({
  providedIn: 'root',
})
export class IncomeAllocationService {
  private defaultJars: JarAllocationItem[] = [
    { id: '1', name: 'Living Expenses', key: 'living', defaultRate: 35, allocatedAmount: 43209876 },
    { id: '2', name: 'Food', key: 'food', defaultRate: 20, allocatedAmount: 24691358 },
    { id: '3', name: 'Children', key: 'children', defaultRate: 10, allocatedAmount: 12345679 },
    { id: '4', name: 'Emergency Fund', key: 'emergency', defaultRate: 10, allocatedAmount: 12345679 },
    { id: '5', name: 'Savings', key: 'savings', defaultRate: 10, allocatedAmount: 12345679 },
    { id: '6', name: 'Investment', key: 'investment', defaultRate: 10, allocatedAmount: 12345679 },
    { id: '7', name: 'Entertainment & Travel', key: 'travel', defaultRate: 5, allocatedAmount: 6172839 },
  ];

  private planSignal = signal<IncomeAllocationPlan>({
    month: 11,
    year: 2026,
    totalIncome: 123456789,
    jars: this.defaultJars,
  });

  readonly plan = this.planSignal.asReadonly();

  saveAllocation(plan: IncomeAllocationPlan): void {
    this.planSignal.set(plan);
    console.log('Saved income allocation plan:', plan);
  }
}

