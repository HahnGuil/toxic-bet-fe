import { Routes } from '@angular/router';

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
		path: 'match',
		loadComponent: () => import('./match/match').then((m) => m.Match),
	},
	{
		path: 'base',
		loadComponent: () => import('./base/base').then((m) => m.Base),
	},
	{
		path: '**',
		redirectTo: entryRoute,
	},
];
