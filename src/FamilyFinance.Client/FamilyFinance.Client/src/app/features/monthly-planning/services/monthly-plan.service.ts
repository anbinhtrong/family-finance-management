import { Injectable, signal } from '@angular/core';
import { MonthlyPlan } from '../models/monthly-plan.model';

@Injectable({
  providedIn: 'root',
})
export class MonthlyPlanService {
  // Mock dữ liệu ban đầu
  private currentPlanSignal = signal<MonthlyPlan | null>({
    month: 11,
    year: 2026,
    status: 'Draft',
    totalIncome: 35000000,
    totalExpense: 22000000,
    netSavings: 13000000,
    items: [
      { id: '1', name: 'Lương chính', type: 'Income', plannedAmount: 30000000, note: 'Lương ròng' },
      { id: '2', name: 'Thưởng / Thu nhập phụ', type: 'Income', plannedAmount: 5000000, note: '' },
      { id: '3', name: 'Tiền nhà & Tiện ích', type: 'Expense', plannedAmount: 8000000, note: 'Điện, nước, internet' },
      { id: '4', name: 'Ăn uống & Đi chợ', type: 'Expense', plannedAmount: 7000000, note: '' },
      { id: '5', name: 'Học phí / Con cái', type: 'Expense', plannedAmount: 4000000, note: '' },
      { id: '6', name: 'Chi tiêu cá nhân', type: 'Expense', plannedAmount: 3000000, note: '' },
    ],
  });

  readonly currentPlan = this.currentPlanSignal.asReadonly();

  savePlan(plan: MonthlyPlan): void {
    this.currentPlanSignal.set(plan);
    console.log('Đã lưu kế hoạch tháng:', plan);
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
        { id: '1', name: 'Lương chính', type: 'Income', plannedAmount: income, note: 'Lương ròng' },
      ],
    });
  }

  setUnavailable(): void {
    this.currentPlanSignal.set(null);
  }
}

