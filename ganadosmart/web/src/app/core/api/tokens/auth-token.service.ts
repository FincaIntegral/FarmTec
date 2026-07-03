import { Injectable } from '@angular/core';
import { apiConfig } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly storage = globalThis.localStorage;

  guardarToken(token: string): void {
    this.storage.setItem(apiConfig.jwt.tokenKey, token);
  }

  obtenerToken(): string | null {
    return this.storage.getItem(apiConfig.jwt.tokenKey);
  }

  eliminarToken(): void {
    this.storage.removeItem(apiConfig.jwt.tokenKey);
  }

  guardarRefreshToken(token: string): void {
    this.storage.setItem(apiConfig.jwt.refreshTokenKey, token);
  }

  obtenerRefreshToken(): string | null {
    return this.storage.getItem(apiConfig.jwt.refreshTokenKey);
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  logout(): void {
    this.eliminarToken();
    this.storage.removeItem(apiConfig.jwt.refreshTokenKey);
  }
}