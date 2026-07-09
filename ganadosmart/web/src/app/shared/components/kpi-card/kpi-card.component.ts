import { Component, input } from '@angular/core';
import { LucideArrowDown, LucideArrowUp, LucideDynamicIcon, type LucideIconData } from '@lucide/angular';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [LucideDynamicIcon, LucideArrowUp, LucideArrowDown],
  templateUrl: './kpi-card.component.html',
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly sub = input<string>();
  readonly delta = input<number>();
  readonly icon = input.required<LucideIconData>();
  readonly accent = input(false);

  protected readonly Math = Math;
}
