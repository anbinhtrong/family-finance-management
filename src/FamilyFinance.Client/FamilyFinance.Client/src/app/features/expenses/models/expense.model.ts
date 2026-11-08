import { PredefinedJarKey } from '../../monthly-planning/models/monthly-plan.model';

export interface Expense {
  id: string;
  planId: string; // e.g. "2026-10"
  jarKey: PredefinedJarKey;
  amount: number; // Positive whole VND
  date: string; // YYYY-MM-DD
  note: string; // Non-empty description
  createdAt: string;
}

export interface CreateExpenseDto {
  jarKey: PredefinedJarKey;
  amount: number;
  date: string;
  note: string;
}

