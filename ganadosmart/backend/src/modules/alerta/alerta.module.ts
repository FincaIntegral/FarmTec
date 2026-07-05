import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertaController } from './alerta.controller';
import { AlertaRepository } from './alerta.repository';
import { AlertaService } from './alerta.service';
import { Alerta } from './entities/alerta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Alerta])],
  controllers: [AlertaController],
  providers: [AlertaService, AlertaRepository],
  exports: [AlertaService],
})
export class AlertaModule {}
