import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthSessionService } from './register/services/auth-session.service';

export const authGuard: CanActivateFn = (route, state) => {
  console.log('AuthGuard executou');
  const authSession = inject(AuthSessionService);
  const router = inject(Router);
  authSession.initializeFromStorage();
  if (authSession.isLoggedIn()) {
    
    return true;
  }
  router.navigate(['/register/login']);
  return false;
};
