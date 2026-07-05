import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionController } from './configuracion.controller';
import { ConfiguracionRepository } from './configuracion.repository';
import { ConfiguracionService } from './configuracion.service';
import { ConfiguracionAprobacion } from './entities/configuracion-aprobacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConfiguracionAprobacion])],
  controllers: [ConfiguracionController],
  providers: [ConfiguracionService, ConfiguracionRepository],
  exports: [ConfiguracionService],
})
export class ConfiguracionModule {}
