import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layouts/app-layout/app-layout';
import { HomePage } from './pages/home-page/home-page';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        component: HomePage,
      },
    ],
  },
];
