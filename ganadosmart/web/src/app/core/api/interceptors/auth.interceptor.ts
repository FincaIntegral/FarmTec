import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthTokenService } from '../tokens/auth-token.service';
import { apiConfig } from '../config/api.config';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly tokenService: AuthTokenService;
  private readonly jwtConfig: typeof apiConfig.jwt;

  constructor() {
    this.tokenService = inject(AuthTokenService);
    this.jwtConfig = apiConfig.jwt;
  }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isAuthEndpoint = req.url.includes('/auth/login');
    const isSyncBatch = req.url.includes('/sincronizacion/lote');

    let headers = req.headers;

    if (!isAuthEndpoint) {
      const token = this.tokenService.obtenerToken();
      if (token) {
        headers = headers.set(this.jwtConfig.headerName, `${this.jwtConfig.headerPrefix} ${token}`);
      }
    }

    if (isSyncBatch) {
      const refreshToken = this.tokenService.obtenerRefreshToken();
      if (refreshToken) {
        headers = headers.set('X-Refresh-Token', refreshToken);
      }
    }

    return next.handle(req.clone({ headers }));
  }
}