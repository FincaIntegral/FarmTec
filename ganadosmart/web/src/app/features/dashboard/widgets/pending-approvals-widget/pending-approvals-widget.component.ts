import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-pending-approvals-widget',
  standalone: true,
  imports: [RouterLink, BadgeComponent],
  templateUrl: './pending-approvals-widget.component.html',
})
export class PendingApprovalsWidgetComponent {
  readonly cantidad = input.required<number>();
}
