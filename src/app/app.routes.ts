import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { adminGuard } from './admin.guard';

import { environment } from '../environments/environment';

const defaultInternalRoute = 'match';
const defaultPublicRoute = 'register/login';
const entryRoute = environment.bypassAuth ? defaultInternalRoute : defaultPublicRoute;

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: entryRoute,
	},
	{
		path: 'register',
		loadChildren: () => import('./register/register.routes').then((m) => m.registerRoutes),
	},
	{
		path: 'login-callback',
		loadComponent: () => import('./register/login/login-callback').then((m) => m.LoginCallbackComponent),
	},
	{
		path: 'oauth/callback',
		loadComponent: () => import('./register/login/login-callback').then((m) => m.LoginCallbackComponent),
	},
	{
  path: 'match',
  loadComponent: () => import('./match/match').then((m) => m.Match),
  canActivate: [authGuard],
  },
	{
  path: 'base',
  loadComponent: () => import('./base/base').then((m) => m.Base),
  canActivate: [authGuard],
  },
	{
  path: 'betting-pool',
  loadComponent: () => import('./betting-pool/betting-pool').then((m) => m.BettingPool),
  canActivate: [authGuard],
  },
	{
  path: 'bet',
  loadComponent: () => import('./bet/bet').then((m) => m.Bet),
  canActivate: [authGuard],
  },
	{
  path: 'user',
  loadComponent: () => import('./user/user').then((m) => m.User),
  canActivate: [authGuard],
  },
	{
  path: 'admin',
  loadComponent: () => import('./admin/admin').then((m) => m.Admin),
  canActivate: [adminGuard],
  },
	{
		path: '**',
		redirectTo: entryRoute,
	},
];
