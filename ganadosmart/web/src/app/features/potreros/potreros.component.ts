import { Component, signal } from '@angular/core';
import { ListadoComponent } from './listado/listado.component';
import { MovimientoComponent } from './movimiento/movimiento.component';

type Tab = 'potreros' | 'movimientos';

@Component({
  selector: 'app-potreros',
  standalone: true,
  imports: [ListadoComponent, MovimientoComponent],
  templateUrl: './potreros.component.html',
})
export class PotrerosComponent {
  readonly tabActiva = signal<Tab>('potreros');

  seleccionarTab(tab: Tab): void {
    this.tabActiva.set(tab);
  }
}
