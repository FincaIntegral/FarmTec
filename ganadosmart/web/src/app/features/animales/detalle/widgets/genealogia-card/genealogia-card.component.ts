import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnimalService } from '../../../../../core/services/animal.service';
import { CardComponent } from '../../../../../shared/components/card/card.component';
import { SectionHeaderComponent } from '../../../../../shared/components/section-header/section-header.component';

@Component({
  selector: 'app-genealogia-card',
  standalone: true,
  imports: [RouterLink, CardComponent, SectionHeaderComponent],
  templateUrl: './genealogia-card.component.html',
})
export class GenealogiaCardComponent {
  private readonly animalService = inject(AnimalService);

  readonly madreId = input<string | null>(null);
  readonly padreId = input<string | null>(null);

  readonly codigoMadre = signal<string | null>(null);
  readonly codigoPadre = signal<string | null>(null);

  constructor() {
    effect(() => {
      const madreId = this.madreId();
      this.codigoMadre.set(null);
      if (madreId) {
        this.animalService.obtener(madreId).subscribe({
          next: (a) => this.codigoMadre.set(a.codigo),
          error: () => this.codigoMadre.set(null),
        });
      }
    });

    effect(() => {
      const padreId = this.padreId();
      this.codigoPadre.set(null);
      if (padreId) {
        this.animalService.obtener(padreId).subscribe({
          next: (a) => this.codigoPadre.set(a.codigo),
          error: () => this.codigoPadre.set(null),
        });
      }
    });
  }
}
