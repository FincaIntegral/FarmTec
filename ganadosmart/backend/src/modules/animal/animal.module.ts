import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertaModule } from '../alerta/alerta.module';
import { PotreroModule } from '../potrero/potrero.module';
import { ReproduccionModule } from '../reproduccion/reproduccion.module';
import { AnimalController } from './animal.controller';
import { AnimalRepository } from './animal.repository';
import { AnimalService } from './animal.service';
import { Animal } from './entities/animal.entity';
import { HistorialPeso } from './entities/historial-peso.entity';
import { Mortalidad } from './entities/mortalidad.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Animal, HistorialPeso, Mortalidad]),
    ReproduccionModule,
    PotreroModule,
    AlertaModule,
  ],
  controllers: [AnimalController],
  providers: [AnimalService, AnimalRepository],
  exports: [AnimalService, AnimalRepository],
})
export class AnimalModule {}
