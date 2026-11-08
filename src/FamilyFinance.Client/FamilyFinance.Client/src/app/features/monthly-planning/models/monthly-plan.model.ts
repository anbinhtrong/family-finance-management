export type PlanStatus = 'Draft' | 'Confirmed';
export type CategoryType = 'Income' | 'Expense';

export interface PlanCategoryItem {
  id: string;
  name: string;
  type: CategoryType;
  plannedAmount: number;
  note?: string;
}

export interface MonthlyPlan {
  id?: string;
  month: number;
  year: number;
  status: PlanStatus;
  items: PlanCategoryItem[];
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
}

