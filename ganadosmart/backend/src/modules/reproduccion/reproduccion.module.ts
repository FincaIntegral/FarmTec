import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Animal } from '../animal/entities/animal.entity';
import { HistorialPeso } from '../animal/entities/historial-peso.entity';
import { Reproduccion } from './entities/reproduccion.entity';
import { ReproduccionController } from './reproduccion.controller';
import { ReproduccionRepository } from './reproduccion.repository';
import { ReproduccionService } from './reproduccion.service';

@Module({
  // Registra Animal/HistorialPeso porque la genealogía del parto crea el
  // becerro y su peso de nacimiento dentro de la misma transacción.
  imports: [TypeOrmModule.forFeature([Reproduccion, Animal, HistorialPeso])],
  controllers: [ReproduccionController],
  providers: [ReproduccionService, ReproduccionRepository],
  exports: [ReproduccionRepository],
})
export class ReproduccionModule {}
