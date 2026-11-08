import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layouts/app-layout/app-layout';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/home-page/home-page').then((m) => m.HomePage),
      },
      {
        path: 'monthly-planning',
        loadComponent: () =>
          import('./pages/monthly-planning-page/monthly-planning-page').then(
            (m) => m.MonthlyPlanningPage
          ),
      },
      {
        path: 'expenses/new',
        loadComponent: () =>
          import('./pages/add-expense-page/add-expense-page').then(
            (m) => m.AddExpensePage
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
