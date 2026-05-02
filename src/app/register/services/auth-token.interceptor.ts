import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthSessionService } from './auth-session.service';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const isLogout = request.method === 'DELETE' && `${request.url}`.includes('/auth-server/login');
  const isExistsByEmail = `${request.url}`.includes('/users/existsByEmail/');
  const isRegisterUser = request.method === 'POST' && /\/users$/.test(request.url) && !request.url.includes('/auth-server/');

  // Adiciona o token para logout, existsByEmail e registro de usuário
  if (!(isLogout || isExistsByEmail || isRegisterUser) || request.headers.has('Authorization')) {
    return next(request);
  }

  const authSessionService = inject(AuthSessionService);
  const token = authSessionService.getAccessToken();

  if (!token) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
