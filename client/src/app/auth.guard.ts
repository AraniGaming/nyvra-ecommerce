import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (
  route,
  state
) => {

  const authService = inject(AuthService);

  const router = inject(Router);

  const navigation =
    router.getCurrentNavigation();

  const fromAdminArea =
    navigation?.extras.state?.['fromAdminArea'] === true;

  if (!authService.isLoggedIn()) {

    router.navigate(['/admin-login']);

    return false;

  }

  if (
    state.url === '/admin' &&
    !fromAdminArea &&
    !authService.consumeFreshAdminAccess()
  ) {

    authService.logout();

    router.navigate(['/admin-login']);

    return false;

  }

    return true;

};
