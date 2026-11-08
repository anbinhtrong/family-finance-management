export type PredefinedJarKey =
  | 'living'
  | 'food'
  | 'children'
  | 'emergency'
  | 'savings'
  | 'investment'
  | 'travel';

export interface PredefinedJar {
  id: string;
  name: string;
  key: PredefinedJarKey;
  defaultRate: number; // Percentage (e.g. 35 for 35%)
}

export interface AllocatedJarItem extends PredefinedJar {
  allocatedAmount: number; // Whole VND
  spentAmount: number; // Total spent in VND
  remainingAmount: number; // allocatedAmount - spentAmount
}

export interface MonthlyPlan {
  id: string; // e.g. "2026-10"
  month: number;
  year: number;
  income: number;
  createdAt: string;
  jars: AllocatedJarItem[];
}
