import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'register/login/callback',
    renderMode: RenderMode.Client,
  },
  {
    path: 'login-callback',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
