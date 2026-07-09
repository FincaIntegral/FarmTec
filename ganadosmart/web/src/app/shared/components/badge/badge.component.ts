import { Component, computed, input } from '@angular/core';

export type BadgeVariant = 'green' | 'red' | 'orange' | 'yellow' | 'sky' | 'purple' | 'gray' | 'blue' | 'amber';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  amber: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800/50',
  green:
    'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800/50',
  red: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-400 dark:border-red-800/50',
  orange:
    'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-400 dark:border-orange-800/50',
  yellow:
    'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-800/50',
  sky: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/50 dark:text-sky-400 dark:border-sky-800/50',
  purple:
    'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-400 dark:border-purple-800/50',
  gray: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700/50',
  blue: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-800/50',
};

@Component({
  selector: 'app-badge',
  standalone: true,
  templateUrl: './badge.component.html',
})
export class BadgeComponent {
  readonly label = input.required<string>();
  readonly variant = input<BadgeVariant>('amber');

  readonly variantClass = computed(() => VARIANT_CLASSES[this.variant()]);
}
