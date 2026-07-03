import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingStateService {
  private readonly pending$ = new BehaviorSubject<number>(0);
  private readonly loading$ = new BehaviorSubject<boolean>(false);

  readonly isLoading = this.loading$.asObservable();

  incrementPending(): void {
    const newCount = this.pending$.value + 1;
    this.pending$.next(newCount);
    this.loading$.next(newCount > 0);
  }

  decrementPending(): void {
    const newCount = Math.max(0, this.pending$.value - 1);
    this.pending$.next(newCount);
    this.loading$.next(newCount > 0);
  }
}