import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, catchError } from 'rxjs';

class ApiError extends Error {
  status?: number;
  url?: string;
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let message: string;

        if (error.error instanceof ErrorEvent) {
          message = 'Error de conexión con el servidor';
        } else {
          const status = error.status;
          const errorBody = typeof error.error === 'object' && error.error !== null
            ? (error.error as { message?: string; error?: string }).message
            : undefined;

          switch (status) {
            case 400:
              message = errorBody || 'Datos de entrada inválidos';
              break;
            case 401:
              message = 'Sesión expirada. Por favor inicia sesión nuevamente';
              break;
            case 403:
              message = 'No tienes permisos para realizar esta acción';
              break;
            case 404:
              message = 'Recurso no encontrado';
              break;
            case 409:
              message = errorBody || 'Conflicto con el estado actual del recurso';
              break;
            case 422:
              message = errorBody || 'Validación fallida';
              break;
            case 500:
              message = 'Error interno del servidor. Intenta más tarde';
              break;
            case 502:
              message = 'Servidor no disponible temporalmente';
              break;
            case 503:
              message = 'Servicio no disponible. Intenta más tarde';
              break;
            default:
              message = errorBody || `Error ${status}`;
          }
        }

        const processedError = new ApiError(message);
        processedError.status = error.status;
        processedError.url = error.url || req.url;

        return throwError(() => processedError);
      })
    );
  }
}