import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { Gasto } from './entities/gasto.entity';
import { GastoController } from './gasto.controller';
import { GastoRepository } from './gasto.repository';
import { GastoService } from './gasto.service';

@Module({
  imports: [TypeOrmModule.forFeature([Gasto]), ConfiguracionModule],
  controllers: [GastoController],
  providers: [GastoService, GastoRepository],
  exports: [GastoService],
})
export class GastoModule {}
