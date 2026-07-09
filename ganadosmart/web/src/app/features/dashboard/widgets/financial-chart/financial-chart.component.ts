import { Component, computed, input } from '@angular/core';

const FORMATO_MONEDA = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-financial-chart',
  standalone: true,
  templateUrl: './financial-chart.component.html',
})
export class FinancialChartComponent {
  readonly ingresos = input.required<number>();
  readonly gastos = input.required<number>();
  readonly balance = input.required<number>();

  readonly maxValor = computed(() => Math.max(this.ingresos(), this.gastos(), 1));
  readonly porcentajeIngresos = computed(() => (this.ingresos() / this.maxValor()) * 100);
  readonly porcentajeGastos = computed(() => (this.gastos() / this.maxValor()) * 100);

  readonly ingresosFormato = computed(() => FORMATO_MONEDA.format(this.ingresos()));
  readonly gastosFormato = computed(() => FORMATO_MONEDA.format(this.gastos()));
  readonly balanceFormato = computed(() => FORMATO_MONEDA.format(this.balance()));
}
