import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateExpenseDto, Expense } from '../models/expense.model';
import { MonthlyPlanService } from '../../monthly-planning/services/monthly-plan.service';
import {
  CreateExpenseRequest,
  CreateExpenseResponse,
  SpendingByJarsResponse,
} from '../../../shared/models/api.model';
import { toBackendJarType } from '../../monthly-planning/models/jar-mapper';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly planService = inject(MonthlyPlanService);
  private readonly baseUrl = `${environment.apiUrl}/budget-plans`;

  private readonly expensesSignal = signal<Expense[]>([]);
  readonly expenses = this.expensesSignal.asReadonly();

  /**
   * Records an expense on the backend API.
   * Calls POST /api/budget-plans/{planId}/expenses.
   */
  recordExpense(planId: string, dto: CreateExpenseDto): Observable<Expense> {
    const payload: CreateExpenseRequest = {
      jarKey: dto.jarKey,
      jarType: toBackendJarType(dto.jarKey),
      amount: dto.amount,
      amountVnd: dto.amount.toString(),
      date: dto.date,
      expenseDate: dto.date,
      note: dto.note,
      description: dto.note,
    };

    return this.http
      .post<CreateExpenseResponse>(`${this.baseUrl}/${planId}/expenses`, payload)
      .pipe(
        map((res) => {
          const expense: Expense = {
            id: String(res.expense.id),
            planId,
            jarKey: dto.jarKey,
            amount: Number(res.expense.amountVnd) || dto.amount,
            date: res.expense.expenseDate || dto.date,
            note: res.expense.description || dto.note,
            createdAt: res.expense.createdAtUtc || new Date().toISOString(),
          };
          return expense;
        }),
        tap((expense) => {
          this.expensesSignal.update((list) => [expense, ...list]);
          this.planService.applyExpense(expense);
        }),
        catchError((err: HttpErrorResponse) => throwError(() => err))
      );
  }

  /**
   * Fetches spending statistics for a plan via GET /api/budget-plans/{planId}/spending-by-jars.
   */
  getSpendingByJars(planId: string): Observable<SpendingByJarsResponse> {
    return this.http
      .get<SpendingByJarsResponse>(`${this.baseUrl}/${planId}/spending-by-jars`)
      .pipe(
        tap((stats) => {
          this.planService.applySpendingStats(stats);
        }),
        catchError((err: HttpErrorResponse) => throwError(() => err))
      );
  }
}
