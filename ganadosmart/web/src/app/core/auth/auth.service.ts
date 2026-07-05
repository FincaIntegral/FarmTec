import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { apiEndpoints } from '../api/config/api-endpoints';
import { ApiClientService } from '../api/http/api-client.service';
import { AuthTokenService } from '../api/tokens/auth-token.service';
import { LoginRequestModel, LoginResponseModel } from '../models/auth';
import { UsuarioDetailModel } from '../models/usuario';

const USUARIO_STORAGE_KEY = 'ganadosmart_usuario_actual';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiClient = inject(ApiClientService);
  private readonly tokenService = inject(AuthTokenService);
  private readonly router = inject(Router);

  private readonly usuarioActual = signal<UsuarioDetailModel | null>(this.leerUsuarioGuardado());
  // signal() propio, no computed() sobre tokenService.estaAutenticado(): computed()
  // solo se recalcula cuando lee OTRAS señales — como esa lectura es un
  // localStorage.getItem() plano, computed() la cachearía para siempre desde
  // la primera evaluación y nunca vería el login/logout posteriores.
  private readonly autenticado = signal<boolean>(this.tokenService.estaAutenticado());

  readonly usuario = this.usuarioActual.asReadonly();
  readonly estaAutenticado = this.autenticado.asReadonly();

  login(dto: LoginRequestModel): Observable<LoginResponseModel> {
    return this.apiClient.post<LoginResponseModel>(apiEndpoints.AUTH.LOGIN, dto).pipe(
      tap((respuesta) => {
        this.tokenService.guardarToken(respuesta.accessToken);
        this.guardarUsuario(respuesta.usuario);
        this.autenticado.set(true);
      })
    );
  }

  logout(): void {
    this.tokenService.logout();
    this.guardarUsuario(null);
    this.autenticado.set(false);
    void this.router.navigateByUrl('/login');
  }

  private guardarUsuario(usuario: UsuarioDetailModel | null): void {
    this.usuarioActual.set(usuario);
    if (usuario) {
      localStorage.setItem(USUARIO_STORAGE_KEY, JSON.stringify(usuario));
    } else {
      localStorage.removeItem(USUARIO_STORAGE_KEY);
    }
  }

  private leerUsuarioGuardado(): UsuarioDetailModel | null {
    const raw = localStorage.getItem(USUARIO_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as UsuarioDetailModel;
    } catch {
      return null;
    }
  }
}
