import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'register/login',
	},
	{
		path: 'register',
		loadChildren: () => import('./register/register.routes').then((m) => m.registerRoutes),
	},
	{
		path: '**',
		redirectTo: 'register/login',
	},
];
