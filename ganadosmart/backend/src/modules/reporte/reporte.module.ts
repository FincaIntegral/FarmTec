import { Module } from '@nestjs/common';
import { GastoModule } from '../gasto/gasto.module';
import { VentaModule } from '../venta/venta.module';
import { ReporteController } from './reporte.controller';
import { ReporteRepository } from './reporte.repository';
import { ReporteService } from './reporte.service';

@Module({
  // Venta/Gasto solo para correr los vencimientos por tiempo antes de contar
  imports: [VentaModule, GastoModule],
  controllers: [ReporteController],
  providers: [ReporteService, ReporteRepository],
})
export class ReporteModule {}
