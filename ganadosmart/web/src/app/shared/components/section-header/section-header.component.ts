import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-header',
  standalone: true,
  templateUrl: './section-header.component.html',
})
export class SectionHeaderComponent {
  readonly title = input.required<string>();
  readonly sub = input<string>();
}
