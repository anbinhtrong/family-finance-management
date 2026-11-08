export type JarKey =
  | 'living'
  | 'food'
  | 'children'
  | 'emergency'
  | 'savings'
  | 'investment'
  | 'travel';

export interface JarAllocationItem {
  id: string;
  name: string;
  key: JarKey;
  defaultRate: number; // Percentage (e.g., 35 for 35%)
  allocatedAmount: number; // Allocated budget in VND
}

export interface IncomeAllocationSession {
  month: number;
  year: number;
  totalIncome: number;
  isConfirmed: boolean;
  jars: JarAllocationItem[];
}
