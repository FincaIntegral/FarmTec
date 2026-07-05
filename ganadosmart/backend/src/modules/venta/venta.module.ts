import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { Animal } from '../animal/entities/animal.entity';
import { Venta } from './entities/venta.entity';
import { VentaController } from './venta.controller';
import { VentaRepository } from './venta.repository';
import { VentaService } from './venta.service';

@Module({
  // Animal solo para validar que animalId pertenezca a la finca.
  imports: [TypeOrmModule.forFeature([Venta, Animal]), ConfiguracionModule],
  controllers: [VentaController],
  providers: [VentaService, VentaRepository],
  exports: [VentaService],
})
export class VentaModule {}
