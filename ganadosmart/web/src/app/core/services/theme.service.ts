import { Injectable, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'ganadosmart-theme';
  readonly theme = signal<'light' | 'dark'>(this.loadTheme());

  constructor() {
    effect(() => {
      const isDark = this.theme() === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem(this.STORAGE_KEY, this.theme());
    });
  }

  private loadTheme(): 'light' | 'dark' {
    const stored = localStorage.getItem(this.STORAGE_KEY) as 'light' | 'dark' | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}
