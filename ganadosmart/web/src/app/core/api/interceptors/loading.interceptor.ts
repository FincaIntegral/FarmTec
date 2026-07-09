import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoadingStateService } from '../tokens/loading-state.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private readonly skipUrls = ['/auth/login'];
  private readonly loading: LoadingStateService;

  constructor() {
    this.loading = inject(LoadingStateService);
  }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.skipUrls.some((path) => req.url.includes(path))) {
      return next.handle(req);
    }

    this.loading.incrementPending();

    return next.handle(req).pipe(
      tap({
        complete: () => this.loading.decrementPending(),
        error: () => this.loading.decrementPending(),
      })
    );
  }
}