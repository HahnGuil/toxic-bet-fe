import { Routes } from '@angular/router';

export const registerRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: 'login/callback',
    loadComponent: () => import('./login/login-callback').then((m) => m.LoginCallbackComponent),
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./cadastro/cadastro').then((m) => m.Cadastro),
  },
];
