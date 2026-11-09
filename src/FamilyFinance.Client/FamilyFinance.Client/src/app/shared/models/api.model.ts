export interface ApiFieldError {
  field: string;
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  errors?: ApiFieldError[];
}

export interface DefaultJarResponse {
  jarType: string;
  name: string;
  percentage: number;
  suggestedLogic: string;
}

export interface DefaultJarsResponse {
  currency: string;
  totalPercentage: number;
  jars: DefaultJarResponse[];
}

export interface CreateBudgetPlanRequest {
  year: number;
  month: number;
  monthlyIncome?: number;
  monthlyIncomeVnd?: string;
}

export interface BudgetJarResponse {
  jarType: string;
  name: string;
  percentage: number;
  budgetVnd: string;
}

export interface BudgetPlanResponse {
  id: number;
  year: number;
  month: number;
  monthlyIncomeVnd: string;
  currency: string;
  createdAtUtc: string;
  jars: BudgetJarResponse[];
}

export interface SpendingByJarItemResponse {
  jarType: string;
  jarName: string;
  percentageUsed: number;
  plannedBudgetVnd: string;
  spentBudgetVnd: string;
}

export interface SpendingByJarsResponse {
  year: number;
  month: number;
  currency: string;
  jars: SpendingByJarItemResponse[];
}

export interface CreateExpenseRequest {
  jarKey?: string;
  jarType?: string;
  amount?: number;
  amountVnd?: string;
  date?: string;
  expenseDate?: string;
  note?: string;
  description?: string;
}

export interface SavedExpenseResponse {
  id: number;
  expenseDate: string;
  jarType: string;
  jarName: string;
  amountVnd: string;
  description: string;
  createdAtUtc: string;
}

export interface ExpenseJarSummaryResponse {
  jarType: string;
  jarName: string;
  percentage: number;
  budgetVnd: string;
  spentVnd: string;
  remainingVnd: string;
}

export interface CreateExpenseResponse {
  expense: SavedExpenseResponse;
  jarSummary: ExpenseJarSummaryResponse;
}

