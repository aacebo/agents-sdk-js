import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/home/home.routes').then(v => v.routes)
  },
  {
    path: '**',
    redirectTo: '/'
  }
];
