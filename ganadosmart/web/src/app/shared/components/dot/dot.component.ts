import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dot',
  standalone: true,
  templateUrl: './dot.component.html',
})
export class DotComponent {
  readonly color = input('bg-amber-500');
}
