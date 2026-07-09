import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../shared/components/topbar/topbar.component';

const TEMA_STORAGE_KEY = 'ganadosmart_tema_oscuro';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  readonly collapsed = signal(false);
  readonly isDark = signal(this.leerTema());

  toggleSidebar(): void {
    this.collapsed.update((valor) => !valor);
  }

  toggleTheme(): void {
    this.isDark.update((valor) => !valor);
    localStorage.setItem(TEMA_STORAGE_KEY, JSON.stringify(this.isDark()));
  }

  private leerTema(): boolean {
    const raw = localStorage.getItem(TEMA_STORAGE_KEY);
    return raw === null ? true : (JSON.parse(raw) as boolean);
  }
}
