import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthSessionService } from './register/services/auth-session.service';

export const adminGuard: CanActivateFn = () => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);
  authSession.initializeFromStorage();
  if (authSession.isLoggedIn() && authSession.isAdmin()) {
    return true;
  }
  router.navigate(['/match']);
  return false;
};
