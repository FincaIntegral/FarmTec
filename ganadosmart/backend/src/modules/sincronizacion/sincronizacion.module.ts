import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimalModule } from '../animal/animal.module';
import { Mortalidad } from '../animal/entities/mortalidad.entity';
import { PotreroModule } from '../potrero/potrero.module';
import { AccionSync } from './entities/accion-sync.entity';
import { SincronizacionController } from './sincronizacion.controller';
import { SincronizacionRepository } from './sincronizacion.repository';
import { SincronizacionService } from './sincronizacion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccionSync, Mortalidad]),
    // Reutiliza la lógica de negocio existente — no duplica validaciones
    AnimalModule,
    PotreroModule,
  ],
  controllers: [SincronizacionController],
  providers: [SincronizacionService, SincronizacionRepository],
})
export class SincronizacionModule {}
