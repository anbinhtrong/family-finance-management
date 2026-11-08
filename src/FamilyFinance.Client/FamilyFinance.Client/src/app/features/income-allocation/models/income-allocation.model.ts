export interface JarAllocationItem {
  id: string;
  name: string;
  key: 'living' | 'food' | 'children' | 'emergency' | 'savings' | 'investment' | 'travel';
  defaultRate: number; // percentage (e.g. 35 for 35%)
  allocatedAmount: number; // amount in VND
}

export interface IncomeAllocationPlan {
  month: number;
  year: number;
  totalIncome: number;
  jars: JarAllocationItem[];
}

