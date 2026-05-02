import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthSessionService } from './auth-session.service';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const isLogout = request.method === 'DELETE' && `${request.url}`.includes('/auth-server/login');
  const isExistsByEmail = `${request.url}`.includes('/users/existsByEmail/');

  // Só adiciona o token para logout ou existsByEmail
  if (!(isLogout || isExistsByEmail) || request.headers.has('Authorization')) {
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
