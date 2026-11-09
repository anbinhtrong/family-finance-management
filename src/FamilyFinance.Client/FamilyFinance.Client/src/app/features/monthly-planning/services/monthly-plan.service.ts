import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AllocatedJarItem,
  MonthlyPlan,
  PredefinedJar,
} from '../models/monthly-plan.model';
import {
  BudgetPlanResponse,
  CreateBudgetPlanRequest,
  DefaultJarsResponse,
  SpendingByJarsResponse,
} from '../../../shared/models/api.model';
import { normalizeJarKey } from '../models/jar-mapper';
import { Expense } from '../../expenses/models/expense.model';

export const DEFAULT_PREDEFINED_JARS: PredefinedJar[] = [
  { id: '1', name: 'Living Expenses', key: 'living', defaultRate: 35 },
  { id: '2', name: 'Food', key: 'food', defaultRate: 20 },
  { id: '3', name: 'Children', key: 'children', defaultRate: 10 },
  { id: '4', name: 'Emergency Fund', key: 'emergency', defaultRate: 10 },
  { id: '5', name: 'Savings', key: 'savings', defaultRate: 10 },
  { id: '6', name: 'Investment', key: 'investment', defaultRate: 10 },
  { id: '7', name: 'Entertainment & Travel', key: 'travel', defaultRate: 5 },
];

@Injectable({
  providedIn: 'root',
})
export class MonthlyPlanService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/budget-plans`;

  private readonly plansSignal = signal<MonthlyPlan[]>([]);
  readonly plans = this.plansSignal.asReadonly();

  private readonly currentPlanSignal = signal<MonthlyPlan | null>(null);
  readonly currentPlan = this.currentPlanSignal.asReadonly();

  /**
   * Returns the 7 fixed predefined jars with their standard rates.
   */
  getDefaultJars(): PredefinedJar[] {
    return DEFAULT_PREDEFINED_JARS;
  }

  /**
   * Fetches the 7 default jars from the backend API.
   */
  fetchDefaultJars(): Observable<PredefinedJar[]> {
    return this.http.get<DefaultJarsResponse>(`${this.baseUrl}/default-jars`).pipe(
      map((res) =>
        res.jars.map((j, index) => ({
          id: String(index + 1),
          name: j.name,
          key: normalizeJarKey(j.jarType),
          defaultRate: j.percentage,
        }))
      )
    );
  }

  /**
   * Calculates allocated whole-VND amounts for the 7 jars.
   */
  calculateAllocations(income: number): AllocatedJarItem[] {
    const validIncome = Math.max(0, Math.floor(income));
    return DEFAULT_PREDEFINED_JARS.map((jar) => {
      const allocated = Math.round((validIncome * jar.defaultRate) / 100);
      return {
        ...jar,
        allocatedAmount: allocated,
        spentAmount: 0,
        remainingAmount: allocated,
      };
    });
  }

  /**
   * Checks cached plans whether a plan already exists for the given year and month.
   */
  hasPlan(year: number, month: number): boolean {
    return this.plansSignal().some((p) => p.year === year && p.month === month);
  }

  /**
   * Finds a cached plan by year and month.
   */
  getPlan(year: number, month: number): MonthlyPlan | undefined {
    return this.plansSignal().find((p) => p.year === year && p.month === month);
  }

  /**
   * Sets the active plan.
   */
  setCurrentPlan(plan: MonthlyPlan | null): void {
    this.currentPlanSignal.set(plan);
  }

  /**
   * Creates a new monthly plan via POST /api/budget-plans.
   */
  createPlan(year: number, month: number, monthlyIncome: number): Observable<MonthlyPlan> {
    const payload: CreateBudgetPlanRequest = {
      year,
      month,
      monthlyIncome,
      monthlyIncomeVnd: monthlyIncome.toString(),
    };

    return this.http.post<BudgetPlanResponse>(this.baseUrl, payload).pipe(
      map((res) => this.mapBudgetPlanResponse(res)),
      tap((plan) => {
        this.upsertPlanInCache(plan);
        this.currentPlanSignal.set(plan);
      }),
      catchError((err: HttpErrorResponse) => throwError(() => err))
    );
  }

  /**
   * Fetches a monthly plan via GET /api/budget-plans?year={year}&month={month}.
   */
  getPlanByMonth(year: number, month: number): Observable<MonthlyPlan> {
    return this.http
      .get<BudgetPlanResponse>(this.baseUrl, {
        params: {
          year: year.toString(),
          month: month.toString(),
        },
      })
      .pipe(
        map((res) => this.mapBudgetPlanResponse(res)),
        tap((plan) => {
          this.upsertPlanInCache(plan);
          this.currentPlanSignal.set(plan);
        }),
        catchError((err: HttpErrorResponse) => throwError(() => err))
      );
  }

  /**
   * Maps backend BudgetPlanResponse DTO to frontend MonthlyPlan model.
   */
  mapBudgetPlanResponse(res: BudgetPlanResponse): MonthlyPlan {
    const planId = `${res.year}-${String(res.month).padStart(2, '0')}`;
    const income = Number(res.monthlyIncomeVnd) || 0;

    const jars: AllocatedJarItem[] = res.jars.map((jar, index) => {
      const jarKey = normalizeJarKey(jar.jarType);
      const allocated = Number(jar.budgetVnd) || 0;
      return {
        id: String(index + 1),
        name: jar.name,
        key: jarKey,
        defaultRate: jar.percentage,
        allocatedAmount: allocated,
        spentAmount: 0,
        remainingAmount: allocated,
      };
    });

    return {
      id: res.id ? String(res.id) : planId,
      year: res.year,
      month: res.month,
      income,
      createdAt: res.createdAtUtc || new Date().toISOString(),
      jars,
    };
  }

  /**
   * Merges spending statistics into a monthly plan.
   */
  applySpendingStats(stats: SpendingByJarsResponse): void {
    this.plansSignal.update((plans) =>
      plans.map((p) => {
        if (p.year !== stats.year || p.month !== stats.month) return p;

        const updatedJars = p.jars.map((jar) => {
          const match = stats.jars.find((sj) => normalizeJarKey(sj.jarType) === jar.key);
          if (!match) return jar;
          const spent = Number(match.spentBudgetVnd) || 0;
          return {
            ...jar,
            spentAmount: spent,
            remainingAmount: jar.allocatedAmount - spent,
          };
        });

        return { ...p, jars: updatedJars };
      })
    );

    const cur = this.currentPlanSignal();
    if (cur && cur.year === stats.year && cur.month === stats.month) {
      const refreshed = this.plansSignal().find((p) => p.year === stats.year && p.month === stats.month);
      if (refreshed) this.currentPlanSignal.set(refreshed);
    }
  }

  /**
   * Locally updates a plan after an expense is recorded.
   */
  applyExpense(expense: Expense): void {
    this.plansSignal.update((plans) =>
      plans.map((p) => {
        if (p.id !== expense.planId) return p;

        const updatedJars = p.jars.map((jar) => {
          if (jar.key !== expense.jarKey) return jar;
          const newSpent = jar.spentAmount + expense.amount;
          return {
            ...jar,
            spentAmount: newSpent,
            remainingAmount: jar.allocatedAmount - newSpent,
          };
        });

        return { ...p, jars: updatedJars };
      })
    );

    const cur = this.currentPlanSignal();
    if (cur && cur.id === expense.planId) {
      const refreshed = this.plansSignal().find((p) => p.id === cur.id);
      if (refreshed) this.currentPlanSignal.set(refreshed);
    }
  }

  private upsertPlanInCache(plan: MonthlyPlan): void {
    this.plansSignal.update((list) => {
      const filtered = list.filter((p) => p.year !== plan.year || p.month !== plan.month);
      return [...filtered, plan];
    });
  }
}
