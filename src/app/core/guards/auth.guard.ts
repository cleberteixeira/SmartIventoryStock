import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Se já sabemos o estado da sessão, decide imediatamente
  if (!auth.isInitializing) {
    return auth.isAuthenticated ? true : router.parseUrl('/login');
  }

  // Se ainda está inicializando (undefined), aguarda o sinal mudar para null ou Session
  return toObservable(auth.session).pipe(
    filter(session => session !== undefined), // Aguarda sair do estado 'undefined'
    map(session => {
      if (!!session) return true;
      return router.parseUrl('/login');
    }),
    take(1)
  );
};